import { useCallback } from "react";

/** v2 has no approved upload/transcription contract; voice is intentionally unavailable. */
export function useConversationVoice({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const unavailable = useCallback(async () => {
    onError(
      "Voice input is unavailable until secure v2 transcription is available. Please type your response.",
    );
  }, [onError]);
  return {
    isRecording: false,
    isTranscribing: false,
    start: unavailable,
    stop: unavailable,
    cancel: async () => undefined,
  };
}
