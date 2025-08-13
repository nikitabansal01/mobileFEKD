import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface UserResponseData {
  name?: string;
  age?: number;
  period_description?: string;
  birth_control?: string[];
  last_period_date?: string;
  cycle_length?: string;
  period_concerns?: string[];
  body_concerns?: string[];
  skin_hair_concerns?: string[];
  mental_health_concerns?: string[];
  other_concerns?: string[];
  top_concern?: string;
  diagnosed_conditions?: string[];
}

export interface SessionData {
  session_id: string;
  device_id: string;
  created_at: string;
  status: string;
}

class SessionService {
  private sessionId: string | null = null;

  // 디바이스 ID 생성
  private getDeviceId(): string {
    return Device.deviceName || Device.modelName || 'unknown-device';
  }

  // 세션 ID 가져오기 (로컬 저장소에서)
  async getSessionId(): Promise<string | null> {
    try {
      const sessionId = await AsyncStorage.getItem('session_id');
      return sessionId;
    } catch (error) {
      console.error('세션 ID 가져오기 실패:', error);
      return null;
    }
  }

  // 세션 ID 저장하기 (로컬 저장소에)
  async saveSessionId(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem('session_id', sessionId);
      this.sessionId = sessionId;
    } catch (error) {
      console.error('세션 ID 저장 실패:', error);
    }
  }

  // 새 세션 생성
  async createSession(): Promise<SessionData | null> {
    try {
      const deviceId = this.getDeviceId();
      
      const response = await fetch(`${API_BASE_URL}/api/v1/questions/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: deviceId
        }),
      });

      if (!response.ok) {
        throw new Error(`세션 생성 실패: ${response.status}`);
      }

      const sessionData: SessionData = await response.json();
      await this.saveSessionId(sessionData.session_id);
      return sessionData;
    } catch (error) {
      console.error('세션 생성 오류:', error);
      return null;
    }
  }

  // 답변 저장
  async saveAnswers(answers: Record<string, any>, questions: any[]): Promise<boolean> {
    try {
      // 세션 유효성 확인 및 필요시 재생성
      const sessionValid = await this.validateAndRefreshSession();
      if (!sessionValid) {
        console.error('세션 생성 실패');
        return false;
      }

      const sessionId = await this.getSessionId();
      if (!sessionId) {
        console.error('세션 ID가 없습니다.');
        return false;
      }

      console.log('답변 저장 시작:', {
        sessionId,
        answersCount: Object.keys(answers).length,
        questionsCount: questions.length
      });

      // 답변을 UserResponseData 형식으로 변환
      const responseData: UserResponseData = {};
      
      // key 매핑 정의
      const keyMapping: Record<string, keyof UserResponseData> = {
        'name': 'name',
        'age': 'age',
        'periodDescription': 'period_description',
        'birthControl': 'birth_control',
        'lastPeriodDate': 'last_period_date',
        'cycleLength': 'cycle_length',
        'periodConcerns': 'period_concerns',
        'bodyConcerns': 'body_concerns',
        'skinAndHairConcerns': 'skin_hair_concerns',
        'mentalHealthConcerns': 'mental_health_concerns',
        'otherConcerns': 'other_concerns',
        'topConcern': 'top_concern',
        'diagnosedCondition': 'diagnosed_conditions'
      };
      
      // 각 질문의 답변을 매핑
      questions.forEach(q => {
        const answer = answers[q.key];
        console.log(`질문 ${q.key}:`, answer);
        if (answer !== undefined && answer !== null && answer !== '') {
          const mappedKey = keyMapping[q.key];
          if (mappedKey) {
            // Others 텍스트 입력 처리
            if (q.key === 'otherConcerns' && Array.isArray(answer)) {
              const processedAnswer = answer.map(item => {
                if (item === 'Others (please specify)' && answers.otherConcernsText) {
                  return `Others: ${answers.otherConcernsText}`;
                }
                return item;
              });
              responseData[mappedKey] = processedAnswer as any;
              console.log(`매핑됨 (Others 처리): ${q.key} -> ${mappedKey} =`, processedAnswer);
            } else if (q.key === 'diagnosedCondition' && Array.isArray(answer)) {
              const processedAnswer = answer.map(item => {
                if (item === 'Others (please specify)' && answers.diagnosedConditionText) {
                  return `Others: ${answers.diagnosedConditionText}`;
                }
                return item;
              });
              responseData[mappedKey] = processedAnswer as any;
              console.log(`매핑됨 (Others 처리): ${q.key} -> ${mappedKey} =`, processedAnswer);
            } else {
              responseData[mappedKey] = answer as any;
              console.log(`매핑됨: ${q.key} -> ${mappedKey} =`, answer);
            }
          } else {
            // 매핑되지 않은 key는 그대로 사용
          responseData[q.key as keyof UserResponseData] = answer;
            console.log(`매핑되지 않음: ${q.key} =`, answer);
          }
        } else {
          console.log(`답변 없음: ${q.key}`);
        }
      });

      const requestBody = {
        session_id: sessionId,
        responses: responseData
      };

      console.log('요청 URL:', `${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/responses`);
      console.log('요청 본문:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('응답 상태:', response.status, response.statusText);
      console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('답변 저장 응답 오류:', errorText);
        throw new Error(`답변 저장 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('답변 저장 성공:', result);
      return true;
    } catch (error) {
      console.error('답변 저장 오류:', error);
      return false;
    }
  }

  // 로그인 후 세션을 사용자와 연결
  async linkSessionToUser(firebaseToken: string): Promise<boolean> {
    try {
      const sessionId = await this.getSessionId();
      if (!sessionId) {
        console.error('세션 ID가 없습니다.');
        return false;
      }

      // Firebase 토큰에서 UID 추출
      const tokenPayload = JSON.parse(atob(firebaseToken.split('.')[1]));
      const uid = tokenPayload.uid;

      const response = await fetch(`${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          uid: uid
        }),
      });

      if (!response.ok) {
        throw new Error(`세션 연결 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('세션 연결 성공:', result);
      return true;
    } catch (error) {
      console.error('세션 연결 오류:', error);
      return false;
    }
  }

  // 세션 초기화
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('session_id');
      this.sessionId = null;
    } catch (error) {
      console.error('세션 초기화 실패:', error);
    }
  }

  // 세션 존재 여부 확인
  async hasSession(): Promise<boolean> {
    const sessionId = await this.getSessionId();
    return sessionId !== null;
  }

  // 세션 유효성 확인 및 필요시 재생성
  async validateAndRefreshSession(): Promise<boolean> {
    try {
      const sessionId = await this.getSessionId();
      if (!sessionId) {
        console.log('세션 ID가 없음 - 새 세션 생성');
        const newSession = await this.createSession();
        return newSession !== null;
      }

      // 기존 세션이 유효한지 확인
      const response = await fetch(`${API_BASE_URL}/api/v1/questions/sessions/${sessionId}/responses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        console.log('기존 세션이 유효하지 않음 - 새 세션 생성');
        await this.clearSession();
        const newSession = await this.createSession();
        return newSession !== null;
      }

      console.log('기존 세션이 유효함');
      return true;
    } catch (error) {
      console.error('세션 유효성 확인 중 오류:', error);
      // 오류 발생 시 새 세션 생성
      await this.clearSession();
      const newSession = await this.createSession();
      return newSession !== null;
    }
  }

  // 로그아웃 시 모든 저장된 정보 삭제
  async logout(): Promise<void> {
    try {
      // 세션 정보 삭제
      await this.clearSession();
      
      // Remember me 정보 삭제
      await AsyncStorage.removeItem('rememberMe');
      await AsyncStorage.removeItem('savedEmail');
      await AsyncStorage.removeItem('savedPassword');
      
      console.log('로그아웃 완료 - 모든 저장된 정보 삭제됨');
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    }
  }
}

export default new SessionService(); 