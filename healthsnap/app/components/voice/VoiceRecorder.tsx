"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AlertCircle, Mic, ShieldAlert } from "lucide-react";
import { RecordButton } from "./RecordButton";
import { RecordingTimer } from "./RecordingTimer";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { AudioPlayback } from "./AudioPlayback";
import {
  type RecordingState,
  type RecordingError,
  type AudioData,
  type VoiceRecorderProps,
} from "./types";
import { cn } from "@/app/lib/utils";

const DEFAULT_MAX_DURATION = 180; // 3 minutes

export function VoiceRecorder({
  onRecordingComplete,
  onSubmit,
  maxDuration = DEFAULT_MAX_DURATION,
  className,
}: VoiceRecorderProps) {
  // State
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<RecordingError | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState<AudioData | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (audioData?.url) {
        URL.revokeObjectURL(audioData.url);
      }
    };
  }, [cleanup, audioData?.url]);

  // Auto-stop when max duration reached
  useEffect(() => {
    if (duration >= maxDuration && state === "recording") {
      stopRecording();
    }
  }, [duration, maxDuration, state]);

  // Start recording
  const startRecording = useCallback(async () => {
    setError(null);
    setState("requesting_permission");

    try {
      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw { type: "not_supported", message: "Your browser doesn't support audio recording" };
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Set up audio context for visualization
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);

        const newAudioData: AudioData = {
          blob,
          url,
          duration,
          mimeType,
        };

        setAudioData(newAudioData);
        setState("recorded");
        onRecordingComplete?.(newAudioData);
      };

      mediaRecorder.onerror = () => {
        setError({ type: "unknown", message: "Recording failed unexpectedly" });
        setState("error");
        cleanup();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setState("recording");
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      cleanup();

      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError({
            type: "permission_denied",
            message: "Microphone access denied. Please allow microphone access to record.",
          });
        } else if (err.name === "NotFoundError") {
          setError({
            type: "not_supported",
            message: "No microphone found. Please connect a microphone and try again.",
          });
        } else {
          setError({
            type: "unknown",
            message: err.message || "Failed to start recording",
          });
        }
      } else if ((err as RecordingError).type) {
        setError(err as RecordingError);
      } else {
        setError({
          type: "unknown",
          message: "An unexpected error occurred",
        });
      }

      setState("error");
    }
  }, [cleanup, duration, onRecordingComplete]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  // Re-record
  const handleReRecord = useCallback(() => {
    if (audioData?.url) {
      URL.revokeObjectURL(audioData.url);
    }

    setAudioData(null);
    setDuration(0);
    setState("idle");
    cleanup();
  }, [audioData?.url, cleanup]);

  // Submit recording
  const handleSubmit = useCallback(async () => {
    if (!audioData || !onSubmit) return;

    setState("uploading");

    try {
      await onSubmit(audioData);
    } catch (err) {
      setError({
        type: "unknown",
        message: err instanceof Error ? err.message : "Failed to submit recording",
      });
      setState("recorded");
    }
  }, [audioData, onSubmit]);

  // Retry after error
  const handleRetry = useCallback(() => {
    setError(null);
    setState("idle");
    cleanup();
  }, [cleanup]);

  return (
    <div
      className={cn(
        "w-full max-w-lg mx-auto p-6 sm:p-8",
        className
      )}
    >
      {/* Error State */}
      {state === "error" && error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-start gap-3">
            {error.type === "permission_denied" ? (
              <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-red-800">
                {error.type === "permission_denied"
                  ? "Microphone Access Required"
                  : error.type === "not_supported"
                  ? "Not Supported"
                  : "Recording Error"}
              </h4>
              <p className="text-sm text-red-600 mt-1">{error.message}</p>
              <button
                onClick={handleRetry}
                className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording / Idle State */}
      {(state === "idle" ||
        state === "requesting_permission" ||
        state === "recording" ||
        state === "paused" ||
        state === "error") &&
        !audioData && (
          <div className="flex flex-col items-center space-y-8">
            {/* Instructions */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">
                Describe Your Symptoms
              </h2>
              <p className="text-slate-500 mt-2 max-w-sm">
                Speak clearly about how you&apos;re feeling. Include details like when
                symptoms started and their severity.
              </p>
            </div>

            {/* Waveform Visualizer */}
            <WaveformVisualizer
              analyser={analyserRef.current}
              isActive={state === "recording"}
              className="w-full"
            />

            {/* Timer */}
            <RecordingTimer
              seconds={duration}
              maxSeconds={maxDuration}
              isRecording={state === "recording"}
            />

            {/* Record Button */}
            <div className="pt-4">
              <RecordButton
                state={state}
                onStart={startRecording}
                onStop={stopRecording}
                disabled={state === "uploading"}
              />
            </div>

            {/* Tips */}
            <div className="w-full mt-8 p-4 bg-teal-50 border border-teal-100 rounded-xl">
              <div className="flex items-start gap-3">
                <Mic className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-teal-800">
                  <p className="font-medium">Recording Tips:</p>
                  <ul className="mt-1 space-y-1 text-teal-700">
                    <li>• Find a quiet environment</li>
                    <li>• Speak at a normal pace</li>
                    <li>• Mention all symptoms you&apos;re experiencing</li>
                    <li>• Include duration and severity</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Playback State */}
      {(state === "recorded" || state === "uploading") && audioData && (
        <AudioPlayback
          audioUrl={audioData.url}
          duration={audioData.duration || duration}
          onReRecord={handleReRecord}
          onSubmit={handleSubmit}
          isSubmitting={state === "uploading"}
        />
      )}
    </div>
  );
}
