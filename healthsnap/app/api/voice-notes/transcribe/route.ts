import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@deepgram/sdk";
import prisma from "@/app/lib/prisma";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const patientId = formData.get("patientId") as string;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "Audio file is required" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create voice note record
    const voiceNote = await prisma.voiceNote.create({
      data: {
        patientId: patientId || "demo-patient",
        duration: 0, // Will be updated after transcription
        status: "transcribing",
        audioBlob: buffer,
      },
    });

    // Transcribe with Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: "nova-2",
        language: "en",
        smart_format: true,
        punctuate: true,
        diarize: false,
      }
    );

    if (error) {
      await prisma.voiceNote.update({
        where: { id: voiceNote.id },
        data: { status: "failed" },
      });

      return NextResponse.json(
        { success: false, error: "Transcription failed" },
        { status: 500 }
      );
    }

    const transcript =
      result.results?.channels[0]?.alternatives[0]?.transcript || "";
    const duration = Math.round(result.metadata?.duration || 0);

    // Update voice note with transcript
    await prisma.voiceNote.update({
      where: { id: voiceNote.id },
      data: {
        transcript,
        duration,
        status: "transcribed",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        voiceNoteId: voiceNote.id,
        transcript,
        duration,
      },
    });
  } catch (error) {
    console.error("Transcription error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Transcription failed",
      },
      { status: 500 }
    );
  }
}
