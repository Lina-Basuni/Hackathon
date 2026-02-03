"use client";

import { memo } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { type RecordButtonProps, type RecordingState } from "./types";
import { cn } from "@/app/lib/utils";

export const RecordButton = memo(function RecordButton({
  state,
  onStart,
  onStop,
  disabled,
}: RecordButtonProps) {
  const isRecording = state === "recording" || state === "paused";
  const isLoading = state === "requesting_permission" || state === "uploading";

  const handleClick = () => {
    if (disabled || isLoading) return;

    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className="relative">
      {/* Pulse rings when recording */}
      {isRecording && (
        <>
          <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
          <div
            className="absolute inset-0 rounded-full bg-red-400 opacity-30"
            style={{
              animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              animationDelay: "0.5s",
            }}
          />
        </>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full transition-all duration-300",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Size
          "w-24 h-24 sm:w-28 sm:h-28",
          // Colors based on state
          isRecording
            ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus-visible:ring-red-300 shadow-lg shadow-red-200"
            : isLoading
            ? "bg-gradient-to-br from-slate-400 to-slate-500 shadow-md"
            : "bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 focus-visible:ring-teal-300 shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-200 hover:scale-105"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-spin" />
        ) : isRecording ? (
          <Square className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-white" />
        ) : (
          <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        )}
      </button>

      {/* State label */}
      <p
        className={cn(
          "absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium whitespace-nowrap transition-colors",
          isRecording
            ? "text-red-600"
            : isLoading
            ? "text-slate-500"
            : "text-teal-600"
        )}
      >
        {getStateLabel(state)}
      </p>
    </div>
  );
});

function getStateLabel(state: RecordingState): string {
  switch (state) {
    case "idle":
      return "Tap to record";
    case "requesting_permission":
      return "Requesting access...";
    case "recording":
      return "Tap to stop";
    case "paused":
      return "Paused";
    case "uploading":
      return "Processing...";
    case "error":
      return "Try again";
    default:
      return "";
  }
}
