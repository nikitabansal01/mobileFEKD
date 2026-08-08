import React from 'react';
import { act, create } from 'react-test-renderer';

import AccountSettingsScreen from '../AccountSettingsScreen';
import { getMyProfile } from '../api';

let mockFocusCallback: (() => void) | undefined;

jest.mock('@react-navigation/native', () => ({
  CommonActions: { reset: jest.fn((payload) => ({ type: 'RESET', payload })) },
  useFocusEffect: (callback: () => void) => {
    mockFocusCallback = callback;
  },
  useNavigation: () => ({ dispatch: jest.fn() }),
}));

jest.mock('../api', () => ({
  getMyProfile: jest.fn(),
  patchMyProfile: jest.fn(),
  requestMyDeletion: jest.fn(),
  requestMyExport: jest.fn(),
}));

jest.mock('../recentAuthentication', () => ({
  checkRecentAuthentication: jest.fn(),
  recentAuthenticationMessage: () => 'Sign in again before continuing.',
}));

jest.mock('../accountSession', () => ({
  clearAcceptedDeletionSession: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const mockGetMyProfile = getMyProfile as jest.Mock;

describe('AccountSettingsScreen accessibility', () => {
  it('exposes named controls for saving, export, and irreversible deletion', async () => {
    mockGetMyProfile.mockResolvedValue({
      user_id: 'user-id',
      display_name: 'Auvra User',
      email: 'user@example.test',
      email_verified: true,
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      created_at: '2026-08-08T00:00:00Z',
      updated_at: '2026-08-08T00:00:00Z',
      version: 1,
    });
    const navigation = { dispatch: jest.fn() };

    let tree!: ReturnType<typeof create>;
    await act(async () => {
      tree = create(<AccountSettingsScreen navigation={navigation} />);
    });
    await act(async () => {
      mockFocusCallback?.();
      await Promise.resolve();
    });

    const labels = tree.root
      .findAll((node) => typeof node.props.accessibilityLabel === 'string')
      .map((node) => node.props.accessibilityLabel);

    expect(labels).toEqual(
      expect.arrayContaining([
        'Save profile',
        'Request data export',
        'Delete account',
      ]),
    );
  });
});
