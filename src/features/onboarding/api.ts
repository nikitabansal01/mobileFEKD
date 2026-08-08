import { v2Client } from '@/src/core/api/runtimeClient';
import type { components } from '@/src/core/api/v2.generated';

export type ConsentRequirement = components['schemas']['ConsentRequirement'];
export type OnboardingSession = components['schemas']['OnboardingSessionResponse'];
export type AssessmentRequest = components['schemas']['AssessmentWriteRequest'];
export type AssessmentResponse = components['schemas']['AssessmentResponse'];
export type ConsentDecision = components['schemas']['ConsentDecision'];
export type Profile = components['schemas']['ProfileResponse'];

export const createOnboardingSession = (idempotencyKey: string) =>
  v2Client.request('post', '/api/v2/onboarding/sessions', {
    authenticated: false,
    idempotencyKey,
  });

export const putAssessment = (
  sessionId: string,
  proofToken: string,
  body: AssessmentRequest,
  expectedVersion: number,
  idempotencyKey: string,
) =>
  v2Client.request(
    'put',
    '/api/v2/onboarding/sessions/{session_id}/assessment',
    {
      path: { session_id: sessionId },
      body,
      authenticated: false,
      headers: {
        'X-Onboarding-Proof': proofToken,
        'If-Match': `"${expectedVersion}"`,
      },
      idempotencyKey,
    },
  );

export const claimOnboardingSession = (
  sessionId: string,
  proofToken: string,
  consents: ConsentDecision[],
  idempotencyKey: string,
) =>
  v2Client.request('post', '/api/v2/onboarding/sessions/{session_id}/claim', {
    path: { session_id: sessionId },
    body: { consents },
    headers: { 'X-Onboarding-Proof': proofToken },
    idempotencyKey,
  });
