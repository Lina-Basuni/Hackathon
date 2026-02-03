"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileAudio,
  AlertTriangle,
  FileText,
  Lightbulb,
  Save,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  Brain,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { cn } from "@/app/lib/utils";
import type { PipelineStage } from "@/app/lib/services/report-pipeline";

// ===========================================
// STAGE CONFIGURATION
// ===========================================

const STAGES: {
  id: PipelineStage;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "uploading",
    label: "Uploading",
    description: "Preparing your voice note",
    icon: Upload,
  },
  {
    id: "transcribing",
    label: "Transcribing",
    description: "Converting speech to text",
    icon: FileAudio,
  },
  {
    id: "analyzing-risks",
    label: "Analyzing Risks",
    description: "Identifying symptoms and risk factors",
    icon: AlertTriangle,
  },
  {
    id: "generating-summary",
    label: "Clinical Summary",
    description: "Creating your health summary",
    icon: FileText,
  },
  {
    id: "generating-recommendations",
    label: "Recommendations",
    description: "Determining next steps",
    icon: Lightbulb,
  },
  {
    id: "saving",
    label: "Finalizing",
    description: "Saving your report",
    icon: Save,
  },
];

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function ProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [currentStage, setCurrentStage] = useState<PipelineStage>("uploading");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Initializing...");
  const [details, setDetails] = useState<string | undefined>();
  const [reportId, setReportId] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isComplete, setIsComplete] = useState(false);

  // Poll for job status
  useEffect(() => {
    if (!jobId) {
      // If no jobId, redirect to record page
      router.push("/record");
      return;
    }

    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/reports/generate?jobId=${jobId}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Failed to get status");
          return;
        }

        const job = data.data;
        setCurrentStage(job.status);
        setProgress(job.progress);
        setMessage(job.message);
        setDetails(job.details);
        setReportId(job.reportId);
        setError(job.error);

        if (job.status === "complete") {
          setIsComplete(true);
          clearInterval(intervalId);

          // Auto-redirect after brief delay
          setTimeout(() => {
            if (job.reportId) {
              router.push(`/report/${job.reportId}`);
            }
          }, 2000);
        } else if (job.status === "error") {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Initial poll
    pollStatus();

    // Start polling
    intervalId = setInterval(pollStatus, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [jobId, router]);

  // Get current stage index
  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            {isComplete ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : error ? (
              <XCircle className="w-10 h-10 text-red-500" />
            ) : (
              <Brain className="w-10 h-10 text-primary animate-pulse" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {isComplete
              ? "Analysis Complete!"
              : error
              ? "Something Went Wrong"
              : "Analyzing Your Symptoms"}
          </h1>
          <p className="text-slate-600">
            {isComplete
              ? "Your health report is ready"
              : error
              ? error
              : message}
          </p>
          {details && !isComplete && !error && (
            <p className="text-sm text-slate-500 mt-1">{details}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Stage Indicators */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="space-y-4">
              {STAGES.map((stage, index) => {
                const Icon = stage.icon;
                const isActive = stage.id === currentStage;
                const isCompleted = index < currentStageIndex || isComplete;
                const isPending = index > currentStageIndex && !isComplete;

                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg transition-all",
                      isActive && "bg-primary/5 border border-primary/20",
                      isCompleted && "opacity-60"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                        isCompleted && "bg-green-100",
                        isActive && "bg-primary/10",
                        isPending && "bg-slate-100"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            isPending ? "text-slate-400" : "text-primary"
                          )}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-medium",
                          isActive && "text-primary",
                          isCompleted && "text-green-700",
                          isPending && "text-slate-400"
                        )}
                      >
                        {stage.label}
                      </p>
                      <p
                        className={cn(
                          "text-sm",
                          isActive
                            ? "text-slate-600"
                            : isPending
                            ? "text-slate-400"
                            : "text-slate-500"
                        )}
                      >
                        {stage.description}
                      </p>
                    </div>

                    {/* Status indicator */}
                    {isActive && (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-100" />
                        <span className="w-2 h-2 bg-primary/30 rounded-full animate-pulse delay-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Success Actions */}
        {isComplete && reportId && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/report/${reportId}`}>
              <Button size="lg" className="w-full sm:w-auto">
                View Your Report
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href={`/doctors?reportId=${reportId}`}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Find a Doctor
              </Button>
            </Link>
          </div>
        )}

        {/* Error Actions */}
        {error && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/record">
              <Button size="lg" className="w-full sm:w-auto">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Go Home
              </Button>
            </Link>
          </div>
        )}

        {/* Processing Message */}
        {!isComplete && !error && (
          <p className="text-center text-sm text-slate-500">
            Please wait while we analyze your symptoms. This usually takes 30-60 seconds.
          </p>
        )}
      </div>
    </div>
  );
}
