import * as SecureStore from 'expo-secure-store';

import type { SecureKeyValueStore } from './userScopedStorage';

const GUEST_ONBOARDING_TICKET_KEY = 'auvra.guest.onboarding.ticket.v2';

export interface GuestConsentRequirement {
  consent_type: string;
  document_version: string;
}

/**
 * This is the entire pre-authentication persistence boundary. It deliberately
 * excludes the Firebase UID, questionnaire answers, display name, and auth
 * credentials; those values must never share a device-wide guest key.
 */
export interface GuestOnboardingTicket {
  session_id: string;
  proof_token: string;
  expires_at: string;
  required_consents: GuestConsentRequirement[];
}

interface GuestTicketEnvelope {
  version: 1;
  value: GuestOnboardingTicket;
}

const storeFor = (store?: SecureKeyValueStore): SecureKeyValueStore =>
  store ?? (SecureStore as SecureKeyValueStore);

const isRequirement = (value: unknown): value is GuestConsentRequirement => {
  if (!value || typeof value !== 'object') return false;
  const requirement = value as Partial<GuestConsentRequirement>;
  return typeof requirement.consent_type === 'string'
    && requirement.consent_type.length > 0
    && typeof requirement.document_version === 'string'
    && requirement.document_version.length > 0;
};

const isTicket = (value: unknown): value is GuestOnboardingTicket => {
  if (!value || typeof value !== 'object') return false;
  const ticket = value as Partial<GuestOnboardingTicket>;
  return typeof ticket.session_id === 'string'
    && ticket.session_id.length > 0
    && typeof ticket.proof_token === 'string'
    && ticket.proof_token.length > 0
    && typeof ticket.expires_at === 'string'
    && Number.isFinite(Date.parse(ticket.expires_at))
    && Array.isArray(ticket.required_consents)
    && ticket.required_consents.every(isRequirement);
};

export async function saveGuestOnboardingTicket(
  ticket: GuestOnboardingTicket,
  store?: SecureKeyValueStore,
): Promise<void> {
  if (!isTicket(ticket) || Date.parse(ticket.expires_at) <= Date.now()) {
    throw new Error('Guest onboarding ticket must be valid and unexpired.');
  }
  await storeFor(store).setItemAsync(
    GUEST_ONBOARDING_TICKET_KEY,
    JSON.stringify({ version: 1, value: ticket } satisfies GuestTicketEnvelope),
    { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
  );
}

export async function getGuestOnboardingTicket(
  store?: SecureKeyValueStore,
): Promise<GuestOnboardingTicket | null> {
  const secureStore = storeFor(store);
  const value = await secureStore.getItemAsync(GUEST_ONBOARDING_TICKET_KEY);
  if (!value) return null;
  try {
    const envelope = JSON.parse(value) as Partial<GuestTicketEnvelope>;
    if (
      envelope.version !== 1
      || !isTicket(envelope.value)
      || Date.parse(envelope.value.expires_at) <= Date.now()
    ) {
      await secureStore.deleteItemAsync(GUEST_ONBOARDING_TICKET_KEY);
      return null;
    }
    return envelope.value;
  } catch {
    await secureStore.deleteItemAsync(GUEST_ONBOARDING_TICKET_KEY);
    return null;
  }
}

export const deleteGuestOnboardingTicket = async (
  store?: SecureKeyValueStore,
): Promise<void> => storeFor(store).deleteItemAsync(GUEST_ONBOARDING_TICKET_KEY);

export const GUEST_ONBOARDING_TICKET_STORAGE_KEY = GUEST_ONBOARDING_TICKET_KEY;
