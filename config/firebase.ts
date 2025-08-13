import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';

// Firebase 설정을 환경변수에서 가져오기
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 환경변수 디버깅
console.log('Firebase Config Debug:', {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET' : 'NOT SET',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'SET' : 'NOT SET',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'NOT SET',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? 'SET' : 'NOT SET',
});

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Auth 인스턴스 생성
export const auth = getAuth(app);

// 이메일/비밀번호 로그인 함수
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 이메일/비밀번호 회원가입 함수
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export default app;
