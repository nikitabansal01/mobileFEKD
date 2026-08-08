import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { type MutableRefObject, useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { createIdempotencyKey } from '@/src/core/api/client';
import { ApiProblemError } from '@/src/core/api/problem';

import {
  getMyProfile,
  patchMyProfile,
  requestMyDeletion,
  requestMyExport,
} from './api';
import {
  deletionRequested,
  exportDeliveryUnavailableMessage,
  exportRequested,
  failedRequest,
  pendingRequest,
} from './accountRequestState';
import { clearAcceptedDeletionSession } from './accountSession';
import {
  checkRecentAuthentication,
  recentAuthenticationMessage,
} from './recentAuthentication';
import type { AccountProfile, DurableRequestState } from './types';

type Navigation = { dispatch(action: ReturnType<typeof CommonActions.reset>): void };

interface AccountSettingsScreenProps {
  navigation?: Navigation;
}

const idle: DurableRequestState = { kind: 'idle' };

const errorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof ApiProblemError)) return fallback;
  if (error.problem.code === 'revision_conflict' || error.status === 412) {
    return 'Your profile changed elsewhere. Reload it, then try again.';
  }
  if (error.problem.code === 'recent_authentication_required') {
    return recentAuthenticationMessage();
  }
  return fallback;
};

const normalizeName = (value: string): string | null => {
  const normalized = value.trim();
  return normalized.length ? normalized : null;
};

const operationKey = (ref: MutableRefObject<string | null>): string => {
  ref.current ??= createIdempotencyKey();
  return ref.current;
};

export default function AccountSettingsScreen({
  navigation: navigationProp,
}: AccountSettingsScreenProps) {
  const hookedNavigation = useNavigation() as unknown as Navigation;
  const navigation = navigationProp ?? hookedNavigation;
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [locale, setLocale] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [exportState, setExportState] = useState<DurableRequestState>(idle);
  const [deletionState, setDeletionState] = useState<DurableRequestState>(idle);
  const profileKey = useRef<string | null>(null);
  const exportKey = useRef<string | null>(null);
  const deletionKey = useRef<string | null>(null);

  const applyProfile = useCallback((next: AccountProfile) => {
    setProfile(next);
    setDisplayName(next.display_name ?? '');
    setTimezone(next.timezone);
    setLocale(next.locale);
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setProfileError(null);
    try {
      applyProfile(await getMyProfile());
    } catch {
      setProfileError('We could not load your account settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const saveProfile = async () => {
    if (!profile) return;
    const nextTimezone = timezone.trim();
    const nextLocale = locale.trim();
    if (!nextTimezone || !nextLocale) {
      setProfileError('Timezone and locale are required.');
      return;
    }
    const key = operationKey(profileKey);
    setSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await patchMyProfile(
        {
          display_name: normalizeName(displayName),
          timezone: nextTimezone,
          locale: nextLocale,
        },
        profile.version,
        key,
      );
      profileKey.current = null;
      applyProfile(updated);
    } catch (error) {
      setProfileError(
        errorMessage(error, 'We could not save your profile. Retry safely.'),
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const requireRecentAuth = async (): Promise<boolean> => {
    const result = await checkRecentAuthentication();
    if (result.recent) return true;
    return false;
  };

  const requestExport = async () => {
    setExportState({ kind: 'checking_recent_auth' });
    if (!(await requireRecentAuth())) {
      setExportState({ kind: 'reauth_required' });
      return;
    }
    const key = operationKey(exportKey);
    setExportState(pendingRequest(key));
    try {
      const response = await requestMyExport(key);
      setExportState(exportRequested(response, key));
    } catch (error) {
      setExportState(
        failedRequest(key, errorMessage(error, 'We could not request your export.')),
      );
    }
  };

  const acknowledgeDeletion = async () => {
    setDeletionState({ kind: 'checking_recent_auth' });
    if (!(await requireRecentAuth())) {
      setDeletionState({ kind: 'reauth_required' });
      return;
    }
    const key = operationKey(deletionKey);
    setDeletionState(pendingRequest(key));
    try {
      const response = await requestMyDeletion(key);
      setDeletionState(deletionRequested(response, key));
      try {
        await clearAcceptedDeletionSession();
      } catch {
        setDeletionState({
          kind: 'cleanup_failed',
          message: 'Deletion was requested, but local sign-out needs to be retried.',
        });
        return;
      }
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'OnboardingScreen' }] }));
    } catch (error) {
      setDeletionState(
        failedRequest(key, errorMessage(error, 'We could not request account deletion.')),
      );
    }
  };

  const confirmDeletion = () => {
    Alert.alert(
      'Delete account?',
      'This requests permanent deletion of your account and associated data. You will be signed out after the request is accepted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => void acknowledgeDeletion(),
        },
      ],
    );
  };

  if (loading) {
    return (
      <View
        style={styles.centered}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading account settings"
      >
        <ActivityIndicator size="large" color={stylesColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} accessibilityLabel="Account settings">
      <Text style={styles.title}>Account settings</Text>
      {profileError ? (
        <View style={styles.notice} accessibilityRole="alert">
          <Text style={styles.noticeText}>{profileError}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Reload profile"
            onPress={() => void loadProfile()}
          >
            <Text style={styles.link}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile?.email ?? 'No email on this account'}</Text>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          accessibilityLabel="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={160}
          style={styles.input}
          autoCapitalize="words"
        />
        <Text style={styles.label}>Timezone</Text>
        <TextInput
          accessibilityLabel="Timezone"
          value={timezone}
          onChangeText={setTimezone}
          maxLength={64}
          style={styles.input}
        />
        <Text style={styles.label}>Locale</Text>
        <TextInput
          accessibilityLabel="Locale"
          value={locale}
          onChangeText={setLocale}
          maxLength={16}
          style={styles.input}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.primaryButton, savingProfile && styles.disabledButton]}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
          accessibilityState={{ disabled: savingProfile }}
          disabled={savingProfile || !profile}
          onPress={() => void saveProfile()}
        >
          <Text style={styles.primaryButtonText}>{savingProfile ? 'Saving…' : 'Save profile'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your data</Text>
        <Text style={styles.copy}>Request a portable copy of your account data.</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          accessibilityRole="button"
          accessibilityLabel="Request data export"
          accessibilityState={{ disabled: exportState.kind === 'submitting' }}
          disabled={exportState.kind === 'submitting'}
          onPress={() => void requestExport()}
        >
          <Ionicons name="download-outline" size={20} color={stylesColors.primary} />
          <Text style={styles.secondaryButtonText}>Request data export</Text>
        </TouchableOpacity>
        <LifecycleNotice
          state={exportState}
          pendingCopy={exportDeliveryUnavailableMessage}
        />
      </View>
      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.sectionTitle}>Delete account</Text>
        <Text style={styles.copy}>
          This creates a durable deletion request. It cannot be undone after processing begins.
        </Text>
        <TouchableOpacity
          style={styles.dangerButton}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          accessibilityState={{ disabled: deletionState.kind === 'submitting' }}
          disabled={deletionState.kind === 'submitting'}
          onPress={confirmDeletion}
        >
          <Text style={styles.dangerButtonText}>Delete account</Text>
        </TouchableOpacity>
        <LifecycleNotice
          state={deletionState}
          pendingCopy="Deletion request accepted. Signing out and clearing this device now."
        />
      </View>
    </ScrollView>
  );
}

function LifecycleNotice({
  state,
  pendingCopy,
}: {
  state: DurableRequestState;
  pendingCopy: string;
}) {
  if (state.kind === 'idle') return null;
  if (state.kind === 'checking_recent_auth') {
    return <Text style={styles.status}>Checking recent sign-in…</Text>;
  }
  if (state.kind === 'submitting') {
    return <Text style={styles.status}>Submitting your request…</Text>;
  }
  if (state.kind === 'requested') return <Text style={styles.status}>{pendingCopy}</Text>;
  if (state.kind === 'reauth_required') {
    return <Text style={styles.error}>{recentAuthenticationMessage()}</Text>;
  }
  return <Text style={styles.error}>{state.message}</Text>;
}

const stylesColors = {
  primary: '#1573FE',
  danger: '#C62828',
  ink: '#171717',
  muted: '#5D6470',
};

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  page: { padding: 20, gap: 16, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '700', color: stylesColors.ink, marginBottom: 4 },
  card: { borderWidth: 1, borderColor: '#E3E6EA', borderRadius: 14, padding: 16, gap: 10 },
  dangerCard: { borderColor: '#F1C8C8' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: stylesColors.ink },
  label: { fontSize: 13, fontWeight: '600', color: stylesColors.muted, marginTop: 4 },
  value: { color: stylesColors.ink, fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#C9CED6', borderRadius: 8, color: stylesColors.ink, minHeight: 44, paddingHorizontal: 12 },
  copy: { color: stylesColors.muted, fontSize: 14, lineHeight: 20 },
  primaryButton: { alignItems: 'center', borderRadius: 8, backgroundColor: stylesColors.primary, minHeight: 44, justifyContent: 'center', marginTop: 6 },
  disabledButton: { opacity: 0.55 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { alignItems: 'center', borderColor: stylesColors.primary, borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 44 },
  secondaryButtonText: { color: stylesColors.primary, fontWeight: '700' },
  dangerButton: { alignItems: 'center', borderRadius: 8, backgroundColor: stylesColors.danger, minHeight: 44, justifyContent: 'center' },
  dangerButtonText: { color: '#fff', fontWeight: '700' },
  status: { color: stylesColors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: stylesColors.danger, fontSize: 14, lineHeight: 20 },
  notice: { backgroundColor: '#FFF5D6', borderRadius: 8, gap: 8, padding: 12 },
  noticeText: { color: stylesColors.ink },
  link: { color: stylesColors.primary, fontWeight: '700' },
});
