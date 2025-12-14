import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth';
// React Native persistence
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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
 * - Native (iOS/Android): AsyncStorage persistence
 * - Web: browser local persistence
 */
export const auth = (() => {
  if (Platform.OS === 'web') {
    const authInstance = getAuth(app);
    // Ensure web uses local (non-session) persistence
    setPersistence(authInstance, browserLocalPersistence).catch((error) => {
      console.log('Persistence setting failed:', error);
    });
    return authInstance;
  }

  // Native (iOS/Android): persist auth state using AsyncStorage
  return initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
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

export default app;
