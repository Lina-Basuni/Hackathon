"use client";

import { memo } from "react";
import { formatTime, type RecordingTimerProps } from "./types";
import { cn } from "@/app/lib/utils";

export const RecordingTimer = memo(function RecordingTimer({
  seconds,
  maxSeconds,
  isRecording,
}: RecordingTimerProps) {
  const progress = (seconds / maxSeconds) * 100;
  const isNearLimit = seconds >= maxSeconds - 30; // Last 30 seconds
  const isAtLimit = seconds >= maxSeconds;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs">
      {/* Time Display */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-mono text-4xl font-bold tracking-wider transition-colors",
            isAtLimit
              ? "text-red-500"
              : isNearLimit
              ? "text-amber-500"
              : "text-slate-800"
          )}
        >
          {formatTime(seconds)}
        </span>
        <span className="text-slate-400 text-lg">/ {formatTime(maxSeconds)}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full",
            isAtLimit
              ? "bg-red-500"
              : isNearLimit
              ? "bg-amber-500"
              : "bg-gradient-to-r from-teal-400 to-teal-500"
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Status Text */}
      <div className="flex items-center gap-2">
        {isRecording && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
        <span
          className={cn(
            "text-sm font-medium",
            isRecording ? "text-red-500" : "text-slate-500"
          )}
        >
          {isAtLimit
            ? "Maximum duration reached"
            : isNearLimit
            ? "Approaching limit"
            : isRecording
            ? "Recording..."
            : "Ready to record"}
        </span>
      </div>
    </div>
  );
});
