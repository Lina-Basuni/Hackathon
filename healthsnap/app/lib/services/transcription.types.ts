// ===========================================
// TRANSCRIPTION SERVICE TYPES
// ===========================================

export interface TranscriptionRequest {
  audio: string | Buffer; // base64 string or Buffer
  mimeType?: string;
  language?: string;
  model?: "nova-2" | "nova-2-medical" | "whisper";
}

export interface TranscriptionResponse {
  success: boolean;
  transcript: string;
  confidence: number;
  duration: number; // in seconds
  words?: TranscribedWord[];
  error?: string;
  provider: "deepgram" | "assemblyai";
}

export interface TranscribedWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

// ===========================================
// DEEPGRAM TYPES
// ===========================================

export interface DeepgramResponse {
  metadata: {
    transaction_key: string;
    request_id: string;
    sha256: string;
    created: string;
    duration: number;
    channels: number;
    models: string[];
    model_info: Record<string, { name: string; version: string }>;
  };
  results: {
    channels: DeepgramChannel[];
  };
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

export interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
}

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

export interface DeepgramError {
  err_code: string;
  err_msg: string;
}

// ===========================================
// ASSEMBLYAI TYPES
// ===========================================

export interface AssemblyAIUploadResponse {
  upload_url: string;
}

export interface AssemblyAITranscriptRequest {
  audio_url: string;
  language_code?: string;
  punctuate?: boolean;
  format_text?: boolean;
}

export interface AssemblyAITranscriptResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string | null;
  confidence: number | null;
  audio_duration: number | null;
  words: AssemblyAIWord[] | null;
  error?: string;
}

export interface AssemblyAIWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

// ===========================================
// SERVICE CONFIG
// ===========================================

export interface TranscriptionConfig {
  provider: "deepgram" | "assemblyai";
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
}

export const DEFAULT_CONFIG: TranscriptionConfig = {
  provider: "deepgram",
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 60000, // 60 seconds
};

// ===========================================
// VALIDATION
// ===========================================

export const SUPPORTED_AUDIO_FORMATS = [
  "audio/webm",
  "audio/wav",
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/flac",
] as const;

export type SupportedAudioFormat = (typeof SUPPORTED_AUDIO_FORMATS)[number];

export function isValidAudioFormat(mimeType: string): mimeType is SupportedAudioFormat {
  return SUPPORTED_AUDIO_FORMATS.includes(mimeType as SupportedAudioFormat);
}
