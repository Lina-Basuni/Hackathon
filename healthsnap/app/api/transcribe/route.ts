import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, checkTranscriptionHealth } from "@/app/lib/services/transcription";
import prisma from "@/app/lib/prisma";

// ===========================================
// POST /api/transcribe
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let audioData: Buffer;
    let mimeType: string;
    let patientId: string | null = null;

    // Handle FormData (multipart) or JSON
    if (contentType.includes("multipart/form-data")) {
      // FormData with audio file
      const formData = await request.formData();
      const audioFile = formData.get("audio") as File | null;
      patientId = formData.get("patientId") as string | null;

      if (!audioFile) {
        return NextResponse.json(
          {
            success: false,
            error: "No audio file provided",
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await audioFile.arrayBuffer();
      audioData = Buffer.from(arrayBuffer);
      mimeType = audioFile.type || "audio/webm";
    } else {
      // JSON with base64 audio
      const body = await request.json();

      if (!body.audio) {
        return NextResponse.json(
          {
            success: false,
            error: "No audio data provided",
          },
          { status: 400 }
        );
      }

      // Handle base64 with or without data URL prefix
      let base64Data = body.audio;
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      audioData = Buffer.from(base64Data, "base64");
      mimeType = body.mimeType || "audio/webm";
      patientId = body.patientId || null;
    }

    // Validate audio size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (audioData.length > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "Audio file too large. Maximum size is 10MB.",
        },
        { status: 413 }
      );
    }

    const minSize = 1024; // 1KB
    if (audioData.length < minSize) {
      return NextResponse.json(
        {
          success: false,
          error: "Audio file too small. Please record a longer message.",
        },
        { status: 400 }
      );
    }

    // Check service health
    const health = await checkTranscriptionHealth();
    if (!health.deepgram && !health.assemblyai) {
      return NextResponse.json(
        {
          success: false,
          error: "Transcription service not configured. Please add API keys.",
        },
        { status: 503 }
      );
    }

    // Perform transcription
    const result = await transcribeAudio({
      audio: audioData,
      mimeType,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Transcription failed",
          provider: result.provider,
        },
        { status: 500 }
      );
    }

    // Save voice note to database if patientId provided
    let voiceNoteId: string | null = null;

    if (patientId) {
      try {
        const voiceNote = await prisma.voiceNote.create({
          data: {
            patientId,
            transcript: result.transcript,
            duration: Math.round(result.duration),
          },
        });
        voiceNoteId = voiceNote.id;
      } catch (dbError) {
        console.error("Failed to save voice note:", dbError);
        // Continue without saving - transcription still succeeded
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        voiceNoteId,
        transcript: result.transcript,
        confidence: result.confidence,
        duration: result.duration,
        wordCount: result.words?.length || 0,
        provider: result.provider,
      },
    });
  } catch (error) {
    console.error("Transcription API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// ===========================================
// GET /api/transcribe (Health Check)
// ===========================================

export async function GET() {
  const health = await checkTranscriptionHealth();

  return NextResponse.json({
    status: "ok",
    services: {
      deepgram: health.deepgram ? "configured" : "not configured",
      assemblyai: health.assemblyai ? "configured" : "not configured",
    },
    primaryProvider: health.deepgram
      ? "deepgram"
      : health.assemblyai
      ? "assemblyai"
      : "none",
  });
}
