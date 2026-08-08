import { auth } from '@/config/firebase';
import { createIdempotencyKey } from '@/src/core/api/client';
import {
  deleteGuestOnboardingTicket,
  getGuestOnboardingTicket,
  saveGuestOnboardingTicket,
  type GuestConsentRequirement,
  type GuestOnboardingTicket,
} from '@/src/core/storage/guestOnboardingTicketStore';
import {
  deleteGuestOnboardingAssessment,
  getGuestOnboardingAssessment,
  saveGuestOnboardingAssessment,
} from '@/src/core/storage/guestOnboardingAssessmentStore';
import { deleteSecureJson, getSecureJson, setSecureJson } from '@/src/core/storage/secureJsonStore';
import { ONBOARDING_DRAFT_TTL_MS } from '@/src/core/storage/storageKeys';
import { clearUserScopedStorage } from '@/src/core/storage/userScopedStorage';
import { userScopedAsyncStorage } from '@/src/core/storage/userScopedAsyncStorage';
import {
  claimOnboardingSession,
  createOnboardingSession,
  putAssessment,
  type ConsentDecision,
  type ConsentRequirement,
} from '@/src/features/onboarding';
import { mapQuestionnaireAnswers } from '@/src/features/onboarding/questionnaire/assessmentMapper';
import type { MobileQuestionnaireV1 } from '@/src/features/onboarding/questionnaire/assessmentMapper';
import type { QuestionnaireAnswers } from '@/src/features/onboarding/questionnaire/types';
import { createPlanGeneration } from '@/src/features/plans';

const JOB_KEY = 'auvra.draft.plan-generation.job.v2';
const SESSION_CREATE_KEY = 'auvra.draft.onboarding-create-key.v2';
type Ticket = GuestOnboardingTicket;
export interface SessionData { session_id: string; device_id: string; created_at: string; status: string }

const requiredConsentTypes = new Set(['privacy', 'health_data_processing']);
const isRequiredConsentSet = (requirements: GuestConsentRequirement[]): boolean =>
  requirements.length >= 2
  && requirements.filter(({ consent_type }) => requiredConsentTypes.has(consent_type)).length === 2
  && new Set(requirements.map(({ consent_type }) => consent_type)).size === requirements.length;

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const stablePayloadHash = (value: unknown): string => {
  let hash = 2_166_136_261;
  for (const char of canonicalJson(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

const assessmentIdempotencyKey = (sessionId: string, revision: number, body: object): string =>
  `assessment-${sessionId}-${revision}-${stablePayloadHash(body)}`;

/**
 * Compatibility façade for retained screens. Health answers are sent directly
 * to v2 and are never stored under the device-wide guest credential key.
 */
class SessionService {
  private transientTicket: Ticket | null = null;
  private selectedConsents: ConsentDecision[] | null = null;
  private assessment: { answers: MobileQuestionnaireV1; timezone: string; version: number } | null = null;

  private async ticket(): Promise<Ticket | null> {
    const persisted = await getGuestOnboardingTicket();
    if (persisted) this.transientTicket = persisted;
    if (!persisted && this.transientTicket && Date.parse(this.transientTicket.expires_at) <= Date.now()) {
      this.transientTicket = null;
    }
    const ticket = persisted ?? this.transientTicket;
    if (!ticket) await deleteGuestOnboardingAssessment();
    return ticket;
  }

  private async assessmentFor(ticket: Ticket): Promise<{ answers: MobileQuestionnaireV1; timezone: string; version: number } | null> {
    if (this.assessment) return this.assessment;
    const draft = await getGuestOnboardingAssessment(ticket.session_id);
    if (!draft) return null;
    this.assessment = {
      answers: draft.answers as MobileQuestionnaireV1,
      timezone: draft.timezone,
      version: draft.revision,
    };
    return this.assessment;
  }

  private async persistAssessment(ticket: Ticket): Promise<void> {
    if (!this.assessment) return;
    await saveGuestOnboardingAssessment({
      session_id: ticket.session_id,
      expires_at: ticket.expires_at,
      timezone: this.assessment.timezone,
      revision: this.assessment.version,
      answers: this.assessment.answers,
    });
  }

  async getSessionId(): Promise<string | null> {
    return (await this.ticket())?.session_id ?? null;
  }

  async getRequiredConsents(): Promise<ConsentRequirement[]> {
    return (await this.ticket())?.required_consents ?? [];
  }

  /** Accepts only an explicit, complete decision against the server's versions. */
  async setClaimConsents(decisions: ConsentDecision[]): Promise<void> {
    const ticket = await this.ticket();
    if (!ticket) throw new Error('Your onboarding session has expired. Please start again.');
    if (!isRequiredConsentSet(ticket.required_consents)) {
      throw new Error('The server did not provide the required consent documents.');
    }
    const expected = new Map(ticket.required_consents.map((item) => [item.consent_type, item.document_version]));
    if (
      decisions.length !== ticket.required_consents.length
      || new Set(decisions.map((item) => item.consent_type)).size !== decisions.length
      || decisions.some((item) => expected.get(item.consent_type) !== item.document_version || !item.granted)
    ) {
      throw new Error('Please explicitly accept every required consent document.');
    }
    // Consent choices are deliberately memory-only. The guest envelope may
    // contain only the server ticket and required document versions.
    this.selectedConsents = decisions.map((item) => ({ ...item }));
  }

  async saveSessionId(sessionId: string): Promise<void> {
    const ticket = await this.ticket();
    if (!ticket || ticket.session_id !== sessionId) return;
    this.transientTicket = ticket;
  }

  async createSession(): Promise<SessionData | null> {
    const existing = await this.ticket();
    if (existing) {
      return { session_id: existing.session_id, device_id: 'server-issued', created_at: existing.expires_at, status: 'active' };
    }
    let idempotencyKey = await getSecureJson<string>(SESSION_CREATE_KEY);
    if (!idempotencyKey) {
      idempotencyKey = createIdempotencyKey();
      await setSecureJson(
        SESSION_CREATE_KEY,
        idempotencyKey,
        ONBOARDING_DRAFT_TTL_MS,
      );
    }
    const session = await createOnboardingSession(idempotencyKey);
    const ticket: Ticket = {
      session_id: session.session_id,
      proof_token: session.proof_token,
      expires_at: session.expires_at,
      required_consents: session.required_consents,
    };
    await saveGuestOnboardingTicket(ticket);
    await deleteSecureJson(SESSION_CREATE_KEY);
    this.transientTicket = ticket;
    return { session_id: session.session_id, device_id: 'server-issued', created_at: session.expires_at, status: 'active' };
  }

  async saveAnswers(answers: QuestionnaireAnswers, _questions: unknown[] = []): Promise<boolean> {
    let ticket = await this.ticket();
    if (!ticket) { await this.createSession(); ticket = await this.ticket(); }
    if (!ticket) return false;
    const mappedAnswers = mapQuestionnaireAnswers(answers);
    if (!Object.keys(mappedAnswers).length) return false;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const request = {
      schema_version: 'mobile-questionnaire.v1',
      timezone,
      answers: mappedAnswers,
    } as const;
    const revision = this.assessment?.version ?? 0;
    const response = await putAssessment(
      ticket.session_id,
      ticket.proof_token,
      request,
      revision,
      assessmentIdempotencyKey(ticket.session_id, revision, request),
    );
    this.assessment = { answers: mappedAnswers, timezone, version: response.version };
    await this.persistAssessment(ticket);
    return true;
  }

  /** Claim with a stable key; proof and health draft remain until plan acceptance. */
  async linkSessionToUser(_firebaseUser?: unknown): Promise<boolean> {
    const ticket = await this.ticket();
    if (!ticket || !auth.currentUser || !this.selectedConsents) return false;
    const startedAt = Date.now();
    try {
      // Reuse one operation key if completion-record persistence fails after
      // the server accepted the claim; the retry must replay rather than claim
      // a now-claimed guest session a second time.
      await claimOnboardingSession(
        ticket.session_id,
        ticket.proof_token,
        this.selectedConsents,
        `onboarding-claim-${ticket.session_id}`,
      );
      const completedAt = Date.now();
      const wrote = await userScopedAsyncStorage.multiSet([
        ['session_link_claimed', 'true'],
        ['session_link_completed_ms', String(completedAt)],
        ['session_link_duration_ms', String(completedAt - startedAt)],
        ['session_link_completed_uid', auth.currentUser.uid],
      ]);
      if (!wrote) throw new Error('Unable to record account setup completion.');
      return true;
    } catch (error) {
      // Do not delete the proof: network failures and server errors are retryable.
      throw error;
    }
  }

  /**
   * Resumable post-auth state machine: claim then accept exactly one initial
   * plan job. Guest state is erased only after both server operations and the
   * user-scoped completion record have succeeded.
   */
  async completeSignup(): Promise<boolean> {
    if (!await this.linkSessionToUser()) return false;
    const ticket = await this.ticket();
    if (!ticket || !auth.currentUser) return false;
    const job = await createPlanGeneration({}, `onboarding-plan-${ticket.session_id}`);
    const completedAt = Date.now();
    const wrote = await userScopedAsyncStorage.multiSet([
      ['session_link_complete', 'true'],
      ['onboarding_plan_job_id', job.job_id],
      ['onboarding_setup_completed_ms', String(completedAt)],
      ['onboarding_setup_completed_uid', auth.currentUser.uid],
    ]);
    if (!wrote) throw new Error('Unable to record personalized plan setup completion.');
    await setSecureJson(JOB_KEY, job.job_id, ONBOARDING_DRAFT_TTL_MS);
    this.transientTicket = null;
    this.selectedConsents = null;
    this.assessment = null;
    await deleteGuestOnboardingTicket();
    await deleteGuestOnboardingAssessment();
    return true;
  }

  /** Used by returning auth flows to resume, not discard, an interrupted signup. */
  async hasPendingSignupRecovery(): Promise<boolean> {
    const ticket = await this.ticket();
    return Boolean(ticket && await this.assessmentFor(ticket));
  }

  async hasCompletedSignupForCurrentUser(): Promise<boolean> {
    if (!auth.currentUser) return false;
    const [complete, owner] = await Promise.all([
      userScopedAsyncStorage.getItem('session_link_complete'),
      userScopedAsyncStorage.getItem('onboarding_setup_completed_uid'),
    ]);
    return complete === 'true' && owner === auth.currentUser.uid;
  }

  async clearSession(): Promise<void> {
    this.transientTicket = null;
    this.selectedConsents = null;
    this.assessment = null;
    await deleteGuestOnboardingTicket();
    await deleteGuestOnboardingAssessment();
    await deleteSecureJson(JOB_KEY);
    await deleteSecureJson(SESSION_CREATE_KEY);
  }

  async hasSession(): Promise<boolean> { return Boolean(await this.ticket()); }
  async validateAndRefreshSession(): Promise<boolean> { return Boolean(await this.ticket()) || Boolean(await this.createSession()); }
  async logout(): Promise<void> {
    this.selectedConsents = null;
    this.assessment = null;
    this.transientTicket = null;
    await deleteGuestOnboardingTicket();
    await deleteGuestOnboardingAssessment();
    await clearUserScopedStorage(auth.currentUser?.uid ?? null);
  }
  async updateSessionLifestyleFocus(lifestyleFocus: string[]): Promise<boolean> {
    const ticket = await this.ticket();
    const assessment = ticket ? await this.assessmentFor(ticket) : null;
    if (!ticket || !assessment) return false;
    const focus = [...new Set(lifestyleFocus)].filter(
      (value): value is 'eat' | 'move' | 'pause' => value === 'eat' || value === 'move' || value === 'pause',
    );
    if (!focus.length) return false;
    const answers: MobileQuestionnaireV1 = { ...assessment.answers, lifestyle_focus: focus };
    const request = {
      schema_version: 'mobile-questionnaire.v1',
      timezone: assessment.timezone,
      answers,
    } as const;
    const response = await putAssessment(
      ticket.session_id,
      ticket.proof_token,
      request,
      assessment.version,
      assessmentIdempotencyKey(ticket.session_id, assessment.version, request),
    );
    this.assessment = { answers, timezone: assessment.timezone, version: response.version };
    await this.persistAssessment(ticket);
    return true;
  }
  async getHormoneAnalysis(): Promise<any | null> { return null; }
}
export default new SessionService();
