"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { PipelineStage, PipelineJob } from "@/app/lib/services/report-pipeline";

// ===========================================
// TYPES
// ===========================================

export interface ReportGenerationState {
  status: "idle" | "processing" | "complete" | "error";
  currentStage: PipelineStage | null;
  progress: number;
  message: string;
  details?: string;
  reportId?: string;
  error?: string;
  jobId?: string;
}

export interface UseReportGenerationReturn extends ReportGenerationState {
  startGeneration: (audioBlob: Blob, patientId?: string) => Promise<void>;
  reset: () => void;
  isProcessing: boolean;
}

// ===========================================
// HOOK
// ===========================================

export function useReportGeneration(): UseReportGenerationReturn {
  const [state, setState] = useState<ReportGenerationState>({
    status: "idle",
    currentStage: null,
    progress: 0,
    message: "",
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/reports/generate?jobId=${jobId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to get job status");
      }

      const job: PipelineJob = data.data;

      setState((prev) => ({
        ...prev,
        currentStage: job.status,
        progress: job.progress,
        message: job.message,
        details: job.details,
        reportId: job.reportId,
        error: job.error,
        status:
          job.status === "complete"
            ? "complete"
            : job.status === "error"
            ? "error"
            : "processing",
      }));

      // Stop polling if complete or error
      if (job.status === "complete" || job.status === "error") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
      // Don't stop polling on transient errors
    }
  }, []);

  // Start report generation
  const startGeneration = useCallback(
    async (audioBlob: Blob, patientId?: string) => {
      // Reset state
      setState({
        status: "processing",
        currentStage: "uploading",
        progress: 0,
        message: "Starting report generation...",
      });

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        // Create form data
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        if (patientId) {
          formData.append("patientId", patientId);
        }

        // Start generation
        const response = await fetch("/api/reports/generate", {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to start generation");
        }

        const jobId = data.data.jobId;

        setState((prev) => ({
          ...prev,
          jobId,
          message: "Processing started...",
        }));

        // Start polling for status
        pollingRef.current = setInterval(() => {
          pollJobStatus(jobId);
        }, 1000);

        // Initial poll
        await pollJobStatus(jobId);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setState({
          status: "error",
          currentStage: "error",
          progress: 0,
          message: "Failed to start generation",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [pollJobStatus]
  );

  // Reset state
  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState({
      status: "idle",
      currentStage: null,
      progress: 0,
      message: "",
    });
  }, []);

  return {
    ...state,
    startGeneration,
    reset,
    isProcessing: state.status === "processing",
  };
}

// ===========================================
// STAGE UTILITIES
// ===========================================

export const STAGE_INFO: Record<
  PipelineStage,
  { label: string; icon: string; description: string }
> = {
  uploading: {
    label: "Uploading",
    icon: "Upload",
    description: "Preparing your voice note for processing",
  },
  transcribing: {
    label: "Transcribing",
    icon: "FileAudio",
    description: "Converting your speech to text",
  },
  "analyzing-risks": {
    label: "Analyzing Risks",
    icon: "AlertTriangle",
    description: "AI is analyzing symptoms and risk factors",
  },
  "generating-summary": {
    label: "Generating Summary",
    icon: "FileText",
    description: "Creating your clinical summary",
  },
  "generating-recommendations": {
    label: "Recommendations",
    icon: "Lightbulb",
    description: "Determining next steps and recommendations",
  },
  saving: {
    label: "Saving",
    icon: "Save",
    description: "Saving your report",
  },
  complete: {
    label: "Complete",
    icon: "CheckCircle",
    description: "Your report is ready!",
  },
  error: {
    label: "Error",
    icon: "XCircle",
    description: "An error occurred",
  },
};

export const ORDERED_STAGES: PipelineStage[] = [
  "uploading",
  "transcribing",
  "analyzing-risks",
  "generating-summary",
  "generating-recommendations",
  "saving",
  "complete",
];
