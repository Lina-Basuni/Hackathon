// ===========================================
// UNIFIED TRANSCRIPTION SERVICE
// ===========================================

import {
  type TranscriptionRequest,
  type TranscriptionResponse,
  type TranscriptionConfig,
  DEFAULT_CONFIG,
  isValidAudioFormat,
} from "./transcription.types";
import { transcribeWithDeepgram, validateAudioBuffer } from "./deepgram";
import { transcribeWithAssemblyAI } from "./assemblyai";

export * from "./transcription.types";

/**
 * Main transcription function with automatic fallback
 *
 * Uses Deepgram by default, falls back to AssemblyAI if Deepgram fails
 */
export async function transcribeAudio(
  request: TranscriptionRequest,
  config: Partial<TranscriptionConfig> = {}
): Promise<TranscriptionResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate audio format
  if (request.mimeType && !isValidAudioFormat(request.mimeType)) {
    return {
      success: false,
      transcript: "",
      confidence: 0,
      duration: 0,
      error: `Unsupported audio format: ${request.mimeType}. Supported formats: webm, wav, mp3, mp4, ogg, flac`,
      provider: finalConfig.provider,
    };
  }

  // Validate audio buffer
  const audioBuffer =
    typeof request.audio === "string"
      ? Buffer.from(request.audio, "base64")
      : request.audio;

  const validation = validateAudioBuffer(audioBuffer);
  if (!validation.valid) {
    return {
      success: false,
      transcript: "",
      confidence: 0,
      duration: 0,
      error: validation.error,
      provider: finalConfig.provider,
    };
  }

  // Try primary provider
  if (finalConfig.provider === "deepgram") {
    const result = await transcribeWithDeepgram(request);

    // If Deepgram succeeds or has a non-retryable error, return
    if (result.success || isNonRetryableError(result.error)) {
      return result;
    }

    // Try AssemblyAI as fallback
    console.warn("Deepgram failed, trying AssemblyAI fallback:", result.error);
    const fallbackResult = await transcribeWithAssemblyAI(request);

    if (fallbackResult.success) {
      return fallbackResult;
    }

    // Return original Deepgram error if fallback also fails
    return result;
  }

  // AssemblyAI as primary
  return transcribeWithAssemblyAI(request);
}

/**
 * Check if error is non-retryable (shouldn't try fallback)
 */
function isNonRetryableError(error?: string): boolean {
  if (!error) return false;

  const nonRetryablePatterns = [
    "too small",
    "too large",
    "Unsupported audio",
    "Invalid API key",
  ];

  return nonRetryablePatterns.some((pattern) =>
    error.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Quick health check for transcription services
 */
export async function checkTranscriptionHealth(): Promise<{
  deepgram: boolean;
  assemblyai: boolean;
}> {
  return {
    deepgram: !!process.env.DEEPGRAM_API_KEY,
    assemblyai: !!process.env.ASSEMBLYAI_API_KEY,
  };
}
