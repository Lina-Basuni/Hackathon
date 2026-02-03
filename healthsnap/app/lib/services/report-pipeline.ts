// ===========================================
// REPORT GENERATION PIPELINE
// Full orchestrator for voice note → report flow
// ===========================================

import prisma from "@/app/lib/prisma";
import { transcribeAudio } from "./transcription";
import { runFullAnalysis, type PatientContext, type FullAnalysisResult } from "./ai-analysis";

// ===========================================
// TYPES
// ===========================================

export type PipelineStage =
  | "uploading"
  | "transcribing"
  | "analyzing-risks"
  | "generating-summary"
  | "generating-recommendations"
  | "saving"
  | "complete"
  | "error";

export interface PipelineProgress {
  stage: PipelineStage;
  progress: number; // 0-100
  message: string;
  details?: string;
}

export interface PipelineResult {
  success: boolean;
  reportId?: string;
  voiceNoteId?: string;
  error?: string;
  analysisResult?: FullAnalysisResult;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

export interface PipelineInput {
  audioBlob: Blob;
  patientId?: string;
  patientContext?: PatientContext;
  onProgress?: ProgressCallback;
}

// ===========================================
// MAIN PIPELINE FUNCTION
// ===========================================

export async function generateFullReport(input: PipelineInput): Promise<PipelineResult> {
  const { audioBlob, patientId = "demo-patient", patientContext, onProgress } = input;

  const reportProgress = (stage: PipelineStage, progress: number, message: string, details?: string) => {
    onProgress?.({ stage, progress, message, details });
  };

  try {
    // ===========================================
    // STAGE 1: Upload Audio
    // ===========================================
    reportProgress("uploading", 5, "Preparing your voice note...");

    // Convert blob to base64 for storage (in production, upload to cloud storage)
    const audioBuffer = await audioBlob.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    const audioUrl = `data:${audioBlob.type};base64,${audioBase64}`;

    reportProgress("uploading", 10, "Voice note prepared");

    // ===========================================
    // STAGE 2: Transcribe Audio
    // ===========================================
    reportProgress("transcribing", 15, "Transcribing your voice note...", "Converting speech to text");

    // Convert Blob to Buffer for transcription service
    const audioArrayBuffer = await audioBlob.arrayBuffer();
    const audioBufferForTranscription = Buffer.from(audioArrayBuffer);

    const transcriptionResult = await transcribeAudio({
      audio: audioBufferForTranscription,
      mimeType: audioBlob.type || "audio/webm",
    });

    if (!transcriptionResult.success || !transcriptionResult.transcript) {
      throw new Error(transcriptionResult.error || "Transcription failed");
    }

    reportProgress("transcribing", 30, "Transcription complete", `${transcriptionResult.transcript.split(" ").length} words detected`);

    // Save voice note to database
    const voiceNote = await prisma.voiceNote.create({
      data: {
        patientId,
        audioUrl,
        transcript: transcriptionResult.transcript,
        duration: Math.round(audioBlob.size / 16000), // Rough estimate
      },
    });

    reportProgress("transcribing", 35, "Voice note saved");

    // ===========================================
    // STAGE 3: AI Analysis
    // ===========================================
    reportProgress("analyzing-risks", 40, "Analyzing symptoms and risk factors...", "AI is reviewing your symptoms");

    const analysisResult = await runFullAnalysis({
      transcript: transcriptionResult.transcript,
      patientContext,
      voiceNoteId: voiceNote.id,
      patientId,
    });

    if (!analysisResult.success) {
      throw new Error("AI analysis failed");
    }

    reportProgress("analyzing-risks", 55, "Risk assessment complete", `Acuity level: ${analysisResult.riskAssessment.overallAcuity}`);

    // ===========================================
    // STAGE 4: Save to Database
    // ===========================================
    reportProgress("generating-summary", 60, "Generating clinical summary...");

    // Save Risk Assessment
    const riskAssessment = await prisma.riskAssessment.create({
      data: {
        voiceNoteId: voiceNote.id,
        riskFlags: JSON.stringify(analysisResult.riskAssessment.riskFlags),
        symptomsExtracted: JSON.stringify(analysisResult.riskAssessment.symptomsExtracted),
        vitalsMentioned: analysisResult.riskAssessment.vitalsMentioned
          ? JSON.stringify(analysisResult.riskAssessment.vitalsMentioned)
          : null,
        overallAcuity: analysisResult.riskAssessment.overallAcuity,
        redFlags: analysisResult.riskAssessment.redFlags
          ? JSON.stringify(analysisResult.riskAssessment.redFlags)
          : null,
        confidence: analysisResult.riskAssessment.confidence,
      },
    });

    reportProgress("generating-summary", 70, "Clinical summary complete");

    // Save Clinical Summary
    const clinicalSummary = await prisma.clinicalSummary.create({
      data: {
        riskAssessmentId: riskAssessment.id,
        chiefComplaint: analysisResult.clinicalSummary.chiefComplaint,
        summaryText: analysisResult.clinicalSummary.summaryText,
        keyFindings: JSON.stringify(analysisResult.clinicalSummary.keyFindings),
        timeline: analysisResult.clinicalSummary.timeline,
        pertinentNegatives: analysisResult.clinicalSummary.pertinentNegatives
          ? JSON.stringify(analysisResult.clinicalSummary.pertinentNegatives)
          : null,
      },
    });

    reportProgress("generating-recommendations", 80, "Generating recommendations...");

    // Save Next Steps
    const nextSteps = await prisma.nextSteps.create({
      data: {
        riskAssessmentId: riskAssessment.id,
        recommendedAction: analysisResult.nextSteps.recommendedAction,
        urgencyTimeframe: analysisResult.nextSteps.urgencyTimeframe,
        reasoning: analysisResult.nextSteps.reasoning,
        patientInstructions: JSON.stringify(analysisResult.nextSteps.patientInstructions),
        warningSigns: JSON.stringify(analysisResult.nextSteps.warningSigns),
        selfCareRecommendations: analysisResult.nextSteps.selfCareRecommendations
          ? JSON.stringify(analysisResult.nextSteps.selfCareRecommendations)
          : null,
        specialistTypeRecommended: analysisResult.nextSteps.specialistTypeRecommended,
      },
    });

    reportProgress("saving", 90, "Saving your report...");

    // Create Report
    const report = await prisma.report.create({
      data: {
        patientId,
        riskAssessmentId: riskAssessment.id,
        clinicalSummaryId: clinicalSummary.id,
        nextStepsId: nextSteps.id,
        status: "final",
      },
    });

    reportProgress("complete", 100, "Report generated successfully!", `Report ID: ${report.id}`);

    return {
      success: true,
      reportId: report.id,
      voiceNoteId: voiceNote.id,
      analysisResult,
    };
  } catch (error) {
    console.error("Pipeline error:", error);
    reportProgress("error", 0, "An error occurred", error instanceof Error ? error.message : "Unknown error");

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate report",
    };
  }
}

// ===========================================
// PIPELINE STATUS TYPES
// ===========================================

export interface PipelineJob {
  id: string;
  status: PipelineStage;
  progress: number;
  message: string;
  details?: string;
  reportId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory job store (in production, use Redis or database)
const jobStore = new Map<string, PipelineJob>();

export function createJob(): string {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  jobStore.set(jobId, {
    id: jobId,
    status: "uploading",
    progress: 0,
    message: "Initializing...",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return jobId;
}

export function updateJob(jobId: string, update: Partial<PipelineJob>) {
  const job = jobStore.get(jobId);
  if (job) {
    Object.assign(job, update, { updatedAt: new Date() });
    jobStore.set(jobId, job);
  }
}

export function getJob(jobId: string): PipelineJob | undefined {
  return jobStore.get(jobId);
}

export function deleteJob(jobId: string) {
  jobStore.delete(jobId);
}

// ===========================================
// STAGE LABELS FOR UI
// ===========================================

export const STAGE_LABELS: Record<PipelineStage, string> = {
  uploading: "Uploading voice note",
  transcribing: "Transcribing audio",
  "analyzing-risks": "Analyzing symptoms",
  "generating-summary": "Generating clinical summary",
  "generating-recommendations": "Creating recommendations",
  saving: "Saving report",
  complete: "Complete",
  error: "Error",
};

export const STAGE_ORDER: PipelineStage[] = [
  "uploading",
  "transcribing",
  "analyzing-risks",
  "generating-summary",
  "generating-recommendations",
  "saving",
  "complete",
];
