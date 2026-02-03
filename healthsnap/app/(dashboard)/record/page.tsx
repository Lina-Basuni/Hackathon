"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Pause, Play, RotateCcw, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useVoiceRecorder } from "@/app/hooks/useVoiceRecorder";
import { formatDuration } from "@/app/lib/utils";

export default function RecordPage() {
  const router = useRouter();
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error: recorderError,
  } = useVoiceRecorder();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!audioBlob) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit audio to the report generation pipeline
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("patientId", "demo-patient");

      const response = await fetch("/api/reports/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to start report generation");
      }

      // Redirect to processing page with job ID
      router.push(`/processing?jobId=${data.data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Record Your Symptoms</h1>
        <p className="text-muted-foreground mt-2">
          Speak naturally about how you&apos;re feeling. Describe any symptoms, their duration, and severity.
        </p>
      </div>

      {/* Recording Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Voice Recording</CardTitle>
          <CardDescription>
            Press the microphone button to start recording
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {(error || recorderError) && (
            <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error || recorderError}
            </div>
          )}

          {/* Recording UI */}
          <div className="flex flex-col items-center py-8">
            {/* Duration Display */}
            <div className="text-4xl font-mono font-bold mb-8">
              {formatDuration(duration)}
            </div>

            {/* Waveform Animation (when recording) */}
            {isRecording && !isPaused && (
              <div className="recording-wave flex items-center gap-1 h-12 mb-8">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1.5 h-8 bg-primary rounded-full"
                  />
                ))}
              </div>
            )}

            {/* Audio Preview (when recorded) */}
            {audioUrl && !isRecording && (
              <audio src={audioUrl} controls className="mb-8 w-full max-w-md" />
            )}

            {/* Control Buttons */}
            <div className="flex items-center gap-4">
              {!isRecording && !audioBlob && (
                <Button
                  size="xl"
                  onClick={startRecording}
                  className="rounded-full w-20 h-20"
                >
                  <Mic className="w-8 h-8" />
                </Button>
              )}

              {isRecording && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="rounded-full w-14 h-14"
                  >
                    {isPaused ? (
                      <Play className="w-6 h-6" />
                    ) : (
                      <Pause className="w-6 h-6" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={stopRecording}
                    className="rounded-full w-20 h-20"
                  >
                    <Square className="w-8 h-8" />
                  </Button>
                </>
              )}

              {audioBlob && !isRecording && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={resetRecording}
                    className="rounded-full w-14 h-14"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </Button>
                  <Button
                    size="xl"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="rounded-full px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Tips for Better Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Speak clearly and at a normal pace</li>
            <li>• Describe all symptoms you&apos;re experiencing</li>
            <li>• Mention when symptoms started</li>
            <li>• Include severity (mild, moderate, severe)</li>
            <li>• Note any medications you&apos;re currently taking</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

