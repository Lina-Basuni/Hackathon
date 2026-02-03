// ===========================================
// DEEPGRAM TRANSCRIPTION SERVICE
// ===========================================

import {
  type TranscriptionRequest,
  type TranscriptionResponse,
  type DeepgramResponse,
  type DeepgramError,
  type TranscribedWord,
  DEFAULT_CONFIG,
} from "./transcription.types";

const DEEPGRAM_API_URL = "https://api.deepgram.com/v1/listen";

interface DeepgramOptions {
  model?: string;
  language?: string;
  punctuate?: boolean;
  smart_format?: boolean;
  diarize?: boolean;
  filler_words?: boolean;
  utterances?: boolean;
}

/**
 * Transcribe audio using Deepgram API
 */
export async function transcribeWithDeepgram(
  request: TranscriptionRequest
): Promise<TranscriptionResponse> {
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      transcript: "",
      confidence: 0,
      duration: 0,
      error: "Deepgram API key not configured",
      provider: "deepgram",
    };
  }

  // Convert base64 to Buffer if needed
  const audioBuffer =
    typeof request.audio === "string"
      ? Buffer.from(request.audio, "base64")
      : request.audio;

  // Build query parameters
  const options: DeepgramOptions = {
    model: request.model || "nova-2",
    language: request.language || "en-US",
    punctuate: true,
    smart_format: true,
    diarize: false, // Single speaker for symptom recording
    filler_words: false,
    utterances: false,
  };

  const queryParams = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const url = `${DEEPGRAM_API_URL}?${queryParams.toString()}`;

  // Attempt transcription with retries
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= DEFAULT_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": request.mimeType || "audio/webm",
        },
        body: audioBuffer,
        signal: AbortSignal.timeout(DEFAULT_CONFIG.timeoutMs),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({})) as DeepgramError;

        // Handle specific error codes
        if (response.status === 401) {
          return {
            success: false,
            transcript: "",
            confidence: 0,
            duration: 0,
            error: "Invalid Deepgram API key",
            provider: "deepgram",
          };
        }

        if (response.status === 402) {
          return {
            success: false,
            transcript: "",
            confidence: 0,
            duration: 0,
            error: "Deepgram API quota exceeded",
            provider: "deepgram",
          };
        }

        if (response.status === 429) {
          // Rate limited - wait and retry
          if (attempt < DEFAULT_CONFIG.maxRetries) {
            await sleep(DEFAULT_CONFIG.retryDelayMs * attempt);
            continue;
          }
          return {
            success: false,
            transcript: "",
            confidence: 0,
            duration: 0,
            error: "Rate limit exceeded. Please try again later.",
            provider: "deepgram",
          };
        }

        throw new Error(
          errorBody.err_msg || `Deepgram API error: ${response.status}`
        );
      }

      const data = (await response.json()) as DeepgramResponse;

      // Extract transcript from response
      const channel = data.results?.channels?.[0];
      const alternative = channel?.alternatives?.[0];

      if (!alternative) {
        return {
          success: false,
          transcript: "",
          confidence: 0,
          duration: data.metadata?.duration || 0,
          error: "No transcription result returned",
          provider: "deepgram",
        };
      }

      // Map words to our format
      const words: TranscribedWord[] = alternative.words?.map((w) => ({
        word: w.punctuated_word || w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
      })) || [];

      return {
        success: true,
        transcript: alternative.transcript,
        confidence: alternative.confidence,
        duration: data.metadata?.duration || 0,
        words,
        provider: "deepgram",
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a timeout or network error
      if (
        lastError.name === "TimeoutError" ||
        lastError.name === "AbortError"
      ) {
        if (attempt < DEFAULT_CONFIG.maxRetries) {
          await sleep(DEFAULT_CONFIG.retryDelayMs * attempt);
          continue;
        }
        return {
          success: false,
          transcript: "",
          confidence: 0,
          duration: 0,
          error: "Request timed out. Please try again.",
          provider: "deepgram",
        };
      }

      // For other errors, retry with backoff
      if (attempt < DEFAULT_CONFIG.maxRetries) {
        await sleep(DEFAULT_CONFIG.retryDelayMs * attempt);
        continue;
      }
    }
  }

  return {
    success: false,
    transcript: "",
    confidence: 0,
    duration: 0,
    error: lastError?.message || "Transcription failed after retries",
    provider: "deepgram",
  };
}

/**
 * Validate audio buffer
 */
export function validateAudioBuffer(buffer: Buffer): {
  valid: boolean;
  error?: string;
} {
  // Check minimum size (at least 1KB for meaningful audio)
  if (buffer.length < 1024) {
    return {
      valid: false,
      error: "Audio file is too small. Please record a longer message.",
    };
  }

  // Check maximum size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: "Audio file is too large. Maximum size is 10MB.",
    };
  }

  return { valid: true };
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
