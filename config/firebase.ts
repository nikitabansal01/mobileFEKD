import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
//@ts-ignore - getReactNativePersistence is exported but types may not be available
import { getReactNativePersistence } from 'firebase/auth';
// React Native persistence
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase configuration object loaded from environment variables
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Environment variable debugging for Firebase configuration
 * Logs which environment variables are set or not set
 */
console.log('Firebase Config Debug:', {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET' : 'NOT SET',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'SET' : 'NOT SET',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'NOT SET',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? 'SET' : 'NOT SET',
});

/**
 * Initialize Firebase app with configuration
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Auth instance with persistence configured per platform
 * - Native (iOS/Android): AsyncStorage persistence (persists after app restart)
 * - Web: browser local persistence
 */
export const auth = (() => {
  if (Platform.OS === 'web') {
    // Web: Use getAuth with browser persistence
    const webAuth = getAuth(app);
    setPersistence(webAuth, browserLocalPersistence).catch((error) => {
      console.log('Web persistence setting failed:', error);
    });
    return webAuth;
  }

  // Native (iOS/Android): Use initializeAuth with AsyncStorage
  // This ensures auth state persists after app restart
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
})();

/**
 * Email/password sign-in function
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with success status and user data or error message
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    // Ensure persistence on web before sign-in so session survives refresh
    if (Platform.OS === 'web') {
      await setPersistence(auth, browserLocalPersistence);
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Email/password sign-up function
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with success status and user data or error message
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Sign out the current user
 * 
 * @returns Promise with success status or error message
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export default app;
