import { AssignmentsResponse, CyclePhaseResponse } from './homeService';

/**
 * Result structure for API calls
 */
interface ApiCallResult {
  success: boolean;
  assignmentCompleted: boolean;
  todayAssignments: AssignmentsResponse | null;
  cyclePhaseData: CyclePhaseResponse | null;
}

/**
 * API Promise Manager
 * 
 * Manages active API promises to prevent duplicate calls and ensure
 * proper cleanup of completed promises. Tracks assignment IDs to
 * maintain context for ongoing operations.
 */
class ApiPromiseManager {
  /** Currently active API promise */
  private activePromise: Promise<ApiCallResult> | null = null;
  
  /** ID of the assignment currently being processed */
  private activeAssignmentId: number | null = null;

  /**
   * Sets the active promise for a specific assignment
   * 
   * @param assignmentId - ID of the assignment being processed
   * @param promise - Promise representing the API call
   */
  setActivePromise(assignmentId: number, promise: Promise<ApiCallResult>) {
    this.activeAssignmentId = assignmentId;
    this.activePromise = promise;
    
    // Automatically clear promise after completion
    promise.finally(() => {
      if (this.activeAssignmentId === assignmentId) {
        this.clearActivePromise();
      }
    });
  }

  /**
   * Gets the currently active promise
   * 
   * @returns The active promise or null if none exists
   */
  getActivePromise(): Promise<ApiCallResult> | null {
    return this.activePromise;
  }

  /**
   * Clears the active promise and assignment ID
   */
  clearActivePromise() {
    this.activePromise = null;
    this.activeAssignmentId = null;
  }

  /**
   * Gets the ID of the assignment currently being processed
   * 
   * @returns The active assignment ID or null if none exists
   */
  getActiveAssignmentId(): number | null {
    return this.activeAssignmentId;
  }
}

export default new ApiPromiseManager();