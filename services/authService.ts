import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth, signInWithEmail } from '@/config/firebase';

// Storage keys
const STORAGE_KEYS = {
  REMEMBER_ME: 'auth_remember_me',
  SAVED_EMAIL: 'auth_saved_email',
  SAVED_PASSWORD: 'auth_saved_password',
  IS_LOGGED_IN: 'auth_is_logged_in',
  USER_UID: 'auth_user_uid',
};

/**
 * Authentication Service
 * 
 * Handles:
 * - Remember Me functionality (saves credentials securely)
 * - Auto-login for users who didn't log out
 * - Proper logout with credential clearing based on remember me preference
 */
class AuthService {
  /**
   * Save credentials if "Remember Me" is enabled
   * 
   * @param email - User's email
   * @param password - User's password
   * @param rememberMe - Whether to save credentials
   */
  async saveCredentials(email: string, password: string, rememberMe: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, JSON.stringify(rememberMe));
      
      if (rememberMe) {
        // Save credentials for auto-fill on next login
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, email);
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, password);
        console.log('✅ Credentials saved for remember me');
      } else {
        // Clear saved credentials if remember me is disabled
        await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
        await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD);
        console.log('🔒 Credentials not saved (remember me disabled)');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  }

  /**
   * Mark user as logged in (for session persistence)
   * 
   * @param uid - Firebase user UID
   */
  async setLoggedIn(uid: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
      await AsyncStorage.setItem(STORAGE_KEYS.USER_UID, uid);
      console.log('✅ User marked as logged in');
    } catch (error) {
      console.error('Error setting logged in state:', error);
    }
  }

  /**
   * Check if user was previously logged in (for auto-login)
   * 
   * @returns Promise<boolean> - Whether user was logged in
   */
  async wasLoggedIn(): Promise<boolean> {
    try {
      const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      return isLoggedIn === 'true';
    } catch (error) {
      console.error('Error checking logged in state:', error);
      return false;
    }
  }

  /**
   * Get saved credentials if "Remember Me" was enabled
   * 
   * @returns Promise<{email: string, password: string} | null>
   */
  async getSavedCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      
      if (rememberMe === 'true') {
        const email = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_EMAIL);
        const password = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD);
        
        if (email && password) {
          console.log('✅ Retrieved saved credentials');
          return { email, password };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting saved credentials:', error);
      return null;
    }
  }

  /**
   * Check if "Remember Me" is enabled
   * 
   * @returns Promise<boolean>
   */
  async isRememberMeEnabled(): Promise<boolean> {
    try {
      const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      return rememberMe === 'true';
    } catch (error) {
      console.error('Error checking remember me:', error);
      return false;
    }
  }

  /**
   * Attempt auto-login using saved credentials
   * 
   * @returns Promise<{success: boolean, user?: any}>
   */
  async attemptAutoLogin(): Promise<{ success: boolean; user?: any; needsPassword?: boolean }> {
    try {
      // First check if Firebase still has the user session
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('✅ Firebase session still active, auto-login successful');
        await this.setLoggedIn(currentUser.uid);
        return { success: true, user: currentUser };
      }

      // Check if user was previously logged in
      const wasLoggedIn = await this.wasLoggedIn();
      if (!wasLoggedIn) {
        console.log('👤 User was not previously logged in');
        return { success: false };
      }

      // Check if we have saved credentials (remember me)
      const credentials = await this.getSavedCredentials();
      if (credentials) {
        console.log('🔐 Attempting auto-login with saved credentials...');
        const result = await signInWithEmail(credentials.email, credentials.password);
        
        if (result.success && result.user) {
          await this.setLoggedIn(result.user.uid);
          console.log('✅ Auto-login successful');
          return { success: true, user: result.user };
        } else {
          console.log('❌ Auto-login failed, credentials may be invalid');
          return { success: false, needsPassword: true };
        }
      }

      // User was logged in but didn't select "remember me"
      // They need to enter password again
      console.log('🔑 User needs to enter password (remember me was not enabled)');
      return { success: false, needsPassword: true };
    } catch (error) {
      console.error('Error during auto-login:', error);
      return { success: false };
    }
  }

  /**
   * Get saved email for pre-filling login form
   * (Only returns email, not password, for security)
   * 
   * @returns Promise<string | null>
   */
  async getSavedEmail(): Promise<string | null> {
    try {
      // Return email if remember me was enabled
      const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      if (rememberMe === 'true') {
        return await AsyncStorage.getItem(STORAGE_KEYS.SAVED_EMAIL);
      }
      return null;
    } catch (error) {
      console.error('Error getting saved email:', error);
      return null;
    }
  }

  /**
   * Logout user
   * - Clears session
   * - Keeps credentials only if "Remember Me" was enabled
   * 
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    try {
      // Sign out from Firebase
      await signOut(auth);
      console.log('✅ Firebase sign out successful');

      // Check if remember me was enabled
      const rememberMe = await this.isRememberMeEnabled();

      // Clear logged in state
      await AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_UID);

      if (!rememberMe) {
        // Clear all saved credentials if remember me was not enabled
        await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
        await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD);
        await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        console.log('🔒 Cleared all credentials (remember me was disabled)');
      } else {
        // Keep credentials for next login
        console.log('💾 Keeping saved credentials (remember me was enabled)');
      }

      console.log('✅ Logout complete');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Full logout - clears everything including remember me
   * Use this for "Log out from all devices" or security-related logout
   * 
   * @returns Promise<void>
   */
  async fullLogout(): Promise<void> {
    try {
      await signOut(auth);
      
      // Clear everything
      await AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_UID);
      await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
      await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD);
      await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      
      console.log('✅ Full logout complete - all data cleared');
    } catch (error) {
      console.error('Error during full logout:', error);
      throw error;
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
