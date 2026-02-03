// ===========================================
// ASSEMBLYAI TRANSCRIPTION SERVICE (FALLBACK)
// ===========================================

import {
  type TranscriptionRequest,
  type TranscriptionResponse,
  type AssemblyAIUploadResponse,
  type AssemblyAITranscriptResponse,
  type TranscribedWord,
  DEFAULT_CONFIG,
} from "./transcription.types";

const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2";

/**
 * Transcribe audio using AssemblyAI API
 * Note: AssemblyAI uses async processing, so this involves multiple API calls
 */
export async function transcribeWithAssemblyAI(
  request: TranscriptionRequest
): Promise<TranscriptionResponse> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      transcript: "",
      confidence: 0,
      duration: 0,
      error: "AssemblyAI API key not configured",
      provider: "assemblyai",
    };
  }

  try {
    // Step 1: Upload the audio file
    const audioBuffer =
      typeof request.audio === "string"
        ? Buffer.from(request.audio, "base64")
        : request.audio;

    const uploadResponse = await fetch(`${ASSEMBLYAI_API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: audioBuffer,
      signal: AbortSignal.timeout(DEFAULT_CONFIG.timeoutMs),
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const uploadData = (await uploadResponse.json()) as AssemblyAIUploadResponse;

    // Step 2: Request transcription
    const transcriptResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: uploadData.upload_url,
        language_code: request.language || "en_us",
        punctuate: true,
        format_text: true,
      }),
      signal: AbortSignal.timeout(DEFAULT_CONFIG.timeoutMs),
    });

    if (!transcriptResponse.ok) {
      throw new Error(`Transcript request failed: ${transcriptResponse.status}`);
    }

    const transcriptData = (await transcriptResponse.json()) as AssemblyAITranscriptResponse;

    // Step 3: Poll for completion
    const result = await pollTranscriptStatus(apiKey, transcriptData.id);

    if (result.status === "error") {
      return {
        success: false,
        transcript: "",
        confidence: 0,
        duration: 0,
        error: result.error || "Transcription failed",
        provider: "assemblyai",
      };
    }

    // Map words to our format
    const words: TranscribedWord[] = result.words?.map((w) => ({
      word: w.text,
      start: w.start / 1000, // Convert ms to seconds
      end: w.end / 1000,
      confidence: w.confidence,
    })) || [];

    return {
      success: true,
      transcript: result.text || "",
      confidence: result.confidence || 0,
      duration: (result.audio_duration || 0) / 1000, // Convert ms to seconds
      words,
      provider: "assemblyai",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      transcript: "",
      confidence: 0,
      duration: 0,
      error: `AssemblyAI transcription failed: ${message}`,
      provider: "assemblyai",
    };
  }
}

/**
 * Poll AssemblyAI for transcript completion
 */
async function pollTranscriptStatus(
  apiKey: string,
  transcriptId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<AssemblyAITranscriptResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = (await response.json()) as AssemblyAITranscriptResponse;

    if (data.status === "completed" || data.status === "error") {
      return data;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Transcription timed out");
}
