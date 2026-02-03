import { NextRequest, NextResponse } from "next/server";
import {
  generateFullReport,
  createJob,
  updateJob,
  getJob,
  type PipelineProgress,
} from "@/app/lib/services/report-pipeline";

// POST /api/reports/generate
// Starts report generation from audio file
// Returns job ID for polling progress
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const patientId = (formData.get("patientId") as string) || "demo-patient";
    const patientContextStr = formData.get("patientContext") as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Parse patient context if provided
    let patientContext;
    if (patientContextStr) {
      try {
        patientContext = JSON.parse(patientContextStr);
      } catch {
        // Ignore invalid JSON
      }
    }

    // Create a job for tracking
    const jobId = createJob();

    // Start processing in background
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type || "audio/webm",
    });

    // Run pipeline with progress updates
    generateFullReport({
      audioBlob,
      patientId,
      patientContext,
      onProgress: (progress: PipelineProgress) => {
        updateJob(jobId, {
          status: progress.stage,
          progress: progress.progress,
          message: progress.message,
          details: progress.details,
        });
      },
    })
      .then((result) => {
        if (result.success) {
          updateJob(jobId, {
            status: "complete",
            progress: 100,
            message: "Report generated successfully",
            reportId: result.reportId,
          });
        } else {
          updateJob(jobId, {
            status: "error",
            progress: 0,
            message: result.error || "Failed to generate report",
            error: result.error,
          });
        }
      })
      .catch((error) => {
        updateJob(jobId, {
          status: "error",
          progress: 0,
          message: error instanceof Error ? error.message : "Unknown error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });

    // Return job ID immediately
    return NextResponse.json({
      success: true,
      data: {
        jobId,
        message: "Report generation started",
      },
    });
  } catch (error) {
    console.error("Error starting report generation:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start report generation",
      },
      { status: 500 }
    );
  }
}

// GET /api/reports/generate?jobId=xxx
// Poll for job status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "Job ID required" },
      { status: 400 }
    );
  }

  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: job,
  });
}
