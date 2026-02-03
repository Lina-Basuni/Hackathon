// Voice Recording Types

export type RecordingState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "paused"
  | "recorded"
  | "uploading"
  | "error";

export interface RecordingError {
  type: "permission_denied" | "not_supported" | "unknown";
  message: string;
}

export interface AudioData {
  blob: Blob;
  url: string;
  duration: number;
  mimeType: string;
}

export interface VoiceRecorderProps {
  onRecordingComplete?: (audio: AudioData) => void;
  onSubmit?: (audio: AudioData) => Promise<void>;
  maxDuration?: number; // in seconds, default 180 (3 min)
  className?: string;
}

export interface RecordButtonProps {
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
  onPause?: () => void;
  onResume?: () => void;
  disabled?: boolean;
}

export interface WaveformVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  className?: string;
}

export interface AudioPlaybackProps {
  audioUrl: string;
  duration: number;
  onReRecord: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export interface RecordingTimerProps {
  seconds: number;
  maxSeconds: number;
  isRecording: boolean;
}

// Utility function to convert blob to base64
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(",")[1]); // Remove data URL prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Format seconds to MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
