import { AssignmentsResponse, CyclePhaseResponse } from './homeService';

interface ApiCallResult {
  success: boolean;
  assignmentCompleted: boolean;
  todayAssignments: AssignmentsResponse | null;
  cyclePhaseData: CyclePhaseResponse | null;
}

class ApiPromiseManager {
  private activePromise: Promise<ApiCallResult> | null = null;
  private activeAssignmentId: number | null = null;

  // API 호출 Promise 설정
  setActivePromise(assignmentId: number, promise: Promise<ApiCallResult>) {
    this.activeAssignmentId = assignmentId;
    this.activePromise = promise;
    
    // Promise 완료 후 자동으로 클리어
    promise.finally(() => {
      if (this.activeAssignmentId === assignmentId) {
        this.clearActivePromise();
      }
    });
  }

  // 현재 활성화된 Promise 가져오기
  getActivePromise(): Promise<ApiCallResult> | null {
    return this.activePromise;
  }

  // Promise 클리어
  clearActivePromise() {
    this.activePromise = null;
    this.activeAssignmentId = null;
  }

  // 현재 처리 중인 assignment ID 확인
  getActiveAssignmentId(): number | null {
    return this.activeAssignmentId;
  }
}

export default new ApiPromiseManager();