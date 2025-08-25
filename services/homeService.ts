import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// 플랫폼별 API URL 설정
const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  
  // 플랫폼별 기본값 설정
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  } else {
    return 'http://localhost:8000';
  }
};

const API_BASE_URL = getApiBaseUrl();

// Firebase 토큰 가져오기
const getAuthToken = async (): Promise<string | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return token;
    }
    return null;
  } catch (error) {
    console.error('❌ Firebase 토큰 가져오기 실패:', error);
    return null;
  }
};

// 타입 정의
export interface CycleInfo {
  user_name: string;
  cycle_day: number;
  phase: string;
}

export interface CyclePhaseResponse {
  cycle_info: CycleInfo;
}

export interface Assignment {
  id: number;
  recommendation_id: number;
  title: string;
  purpose: string;
  category: string;
  conditions: string[];
  symptoms: string[];
  hormones: string[];
  is_completed: boolean;
  completed_at: string;
  advices: string[];
  food_amounts: string[];
  food_items: string[];
  exercise_durations: string[];
  exercise_types: string[];
  exercise_intensities: string[];
  mindfulness_durations: string[];
  mindfulness_techniques: string[];
}

export interface AssignmentsResponse {
  date: string;
  assignments: {
    [key: string]: Assignment[];
  };
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number;
  hormone_stats: {
    [key: string]: {
      [key: string]: number;
    };
  };
}

export interface HormoneStats {
  androgens?: { completed: number; total: number };
  progesterone?: { completed: number; total: number };
  estrogen?: { completed: number; total: number };
  thyroid?: { completed: number; total: number };
  insulin?: { completed: number; total: number };
  cortisol?: { completed: number; total: number };
  FSH?: { completed: number; total: number };
  LH?: { completed: number; total: number };
  prolactin?: { completed: number; total: number };
  ghrelin?: { completed: number; total: number };
}

export interface ProgressStatsResponse {
  hormone_stats: HormoneStats;
}

class HomeService {
  // 생리 주기 정보 조회
  async getCyclePhase(): Promise<CyclePhaseResponse | null> {
    try {
      console.log('🔄 생리 주기 정보 조회 API 호출:', `${API_BASE_URL}/api/v1/cycle/phase`);

      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Firebase 토큰 포함됨');
      } else {
        console.log('⚠️ Firebase 토큰 없음');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/cycle/phase`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 생리 주기 정보 조회 실패:', errorText);
        throw new Error(`생리 주기 정보 조회 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ 생리 주기 정보 조회 성공:', result);
      return result;
    } catch (error) {
      console.error('❌ 생리 주기 정보 조회 오류:', error);
      return null;
    }
  }

  // 오늘의 액션 플랜 조회
  async getTodayAssignments(): Promise<AssignmentsResponse | null> {
    try {
      console.log('🔄 오늘의 액션 플랜 조회 API 호출:', `${API_BASE_URL}/api/v1/new-scheduling/assignments/today`);

      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Firebase 토큰 포함됨');
      } else {
        console.log('⚠️ Firebase 토큰 없음');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/new-scheduling/assignments/today`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 오늘의 액션 플랜 조회 실패:', errorText);
        throw new Error(`오늘의 액션 플랜 조회 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ 오늘의 액션 플랜 조회 성공:', result);
      return result;
    } catch (error) {
      console.error('❌ 오늘의 액션 플랜 조회 오류:', error);
      return null;
    }
  }

  // 진행도 통계 조회
  async getProgressStats(): Promise<ProgressStatsResponse | null> {
    try {
      console.log('🔄 진행도 통계 조회 API 호출:', `${API_BASE_URL}/api/v1/progress/stats`);

      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Firebase 토큰 포함됨');
      } else {
        console.log('⚠️ Firebase 토큰 없음');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/progress/stats`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 진행도 통계 조회 실패:', errorText);
        throw new Error(`진행도 통계 조회 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ 진행도 통계 조회 성공:', result);
      return result;
    } catch (error) {
      console.error('❌ 진행도 통계 조회 오류:', error);
      return null;
    }
  }
}

export default new HomeService();
