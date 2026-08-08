import * as SecureStore from 'expo-secure-store';

import type { SecureKeyValueStore } from './userScopedStorage';

const GUEST_ONBOARDING_ASSESSMENT_KEY = 'auvra.guest.onboarding.assessment.v2';

/** Encrypted, device-only health draft for a validated, unclaimed session. */
export interface GuestOnboardingAssessmentDraft {
  session_id: string;
  expires_at: string;
  timezone: string;
  revision: number;
  answers: object;
}

interface AssessmentEnvelope { version: 1; value: GuestOnboardingAssessmentDraft; }

const storeFor = (store?: SecureKeyValueStore): SecureKeyValueStore =>
  store ?? (SecureStore as SecureKeyValueStore);

const isDraft = (value: unknown): value is GuestOnboardingAssessmentDraft => {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<GuestOnboardingAssessmentDraft>;
  return typeof draft.session_id === 'string'
    && draft.session_id.length > 0
    && typeof draft.expires_at === 'string'
    && Number.isFinite(Date.parse(draft.expires_at))
    && typeof draft.timezone === 'string'
    && draft.timezone.length > 0
    && Number.isInteger(draft.revision)
    && (draft.revision ?? -1) >= 0
    && Boolean(draft.answers)
    && typeof draft.answers === 'object'
    && !Array.isArray(draft.answers);
};

export async function saveGuestOnboardingAssessment(
  draft: GuestOnboardingAssessmentDraft,
  store?: SecureKeyValueStore,
): Promise<void> {
  if (!isDraft(draft) || Date.parse(draft.expires_at) <= Date.now()) {
    throw new Error('Guest onboarding assessment draft must be valid and unexpired.');
  }
  await storeFor(store).setItemAsync(
    GUEST_ONBOARDING_ASSESSMENT_KEY,
    JSON.stringify({ version: 1, value: draft } satisfies AssessmentEnvelope),
    { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
  );
}

export async function getGuestOnboardingAssessment(
  sessionId: string,
  store?: SecureKeyValueStore,
): Promise<GuestOnboardingAssessmentDraft | null> {
  const secureStore = storeFor(store);
  const serialized = await secureStore.getItemAsync(GUEST_ONBOARDING_ASSESSMENT_KEY);
  if (!serialized) return null;
  try {
    const envelope = JSON.parse(serialized) as Partial<AssessmentEnvelope>;
    if (
      envelope.version !== 1
      || !isDraft(envelope.value)
      || envelope.value.session_id !== sessionId
      || Date.parse(envelope.value.expires_at) <= Date.now()
    ) {
      await secureStore.deleteItemAsync(GUEST_ONBOARDING_ASSESSMENT_KEY);
      return null;
    }
    return envelope.value;
  } catch {
    await secureStore.deleteItemAsync(GUEST_ONBOARDING_ASSESSMENT_KEY);
    return null;
  }
}

export const deleteGuestOnboardingAssessment = async (
  store?: SecureKeyValueStore,
): Promise<void> => storeFor(store).deleteItemAsync(GUEST_ONBOARDING_ASSESSMENT_KEY);

export const GUEST_ONBOARDING_ASSESSMENT_STORAGE_KEY = GUEST_ONBOARDING_ASSESSMENT_KEY;
