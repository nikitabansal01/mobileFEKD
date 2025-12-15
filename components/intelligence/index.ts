/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUVRA INTELLIGENCE COMPONENTS INDEX
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Export all intelligence-related components for easy importing.
 * 
 * Usage:
 * import { WellnessDashboard, SymptomPredictionCard, MoodTracker } from '@/components/intelligence';
 */

// Core wellness components
export { default as WellnessDashboard } from '../WellnessDashboard';
export { default as SymptomPredictionCard } from '../SymptomPredictionCard';
export { default as MoodTracker } from '../MoodTracker';

// Chat enhancements
export { default as SessionSummaryModal } from '../SessionSummaryModal';
export { default as QuickActionsBar } from '../QuickActionsBar';

// Settings
export { default as VoiceSettings } from '../VoiceSettings';

// Re-export types for convenience
export type {
  WellnessScoreResponse,
  SymptomPrediction,
  SymptomPredictionsResponse,
  SessionSummaryResponse,
  PhaseTransition,
  MoodEntry,
} from '../../services/chatService';
