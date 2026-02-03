"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Play, Pause, RotateCcw, Send, Loader2 } from "lucide-react";
import { formatTime, type AudioPlaybackProps } from "./types";
import { cn } from "@/app/lib/utils";

export const AudioPlayback = memo(function AudioPlayback({
  audioUrl,
  duration,
  onReRecord,
  onSubmit,
  isSubmitting,
}: AudioPlaybackProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Playback Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-800">Recording Complete</h3>
          <p className="text-sm text-slate-500 mt-1">
            Review your recording before submitting
          </p>
        </div>

        {/* Waveform-style progress bar */}
        <div className="space-y-3">
          <div className="relative h-12 bg-slate-50 rounded-xl overflow-hidden">
            {/* Static waveform background */}
            <div className="absolute inset-0 flex items-center justify-around px-2">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-slate-200 rounded-full"
                  style={{
                    height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}px`,
                  }}
                />
              ))}
            </div>

            {/* Progress overlay */}
            <div
              className="absolute inset-0 flex items-center justify-around px-2 overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-teal-500 rounded-full flex-shrink-0"
                  style={{
                    height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Seek slider */}
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3
                       [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:bg-teal-500
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:shadow-md
                       [&::-webkit-slider-thumb]:cursor-pointer"
          />

          {/* Time display */}
          <div className="flex justify-between text-sm font-mono text-slate-500">
            <span>{formatTime(Math.floor(currentTime))}</span>
            <span>{formatTime(Math.floor(duration))}</span>
          </div>
        </div>

        {/* Play/Pause Button */}
        <div className="flex justify-center">
          <button
            onClick={togglePlayback}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all",
              "bg-slate-100 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            )}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-slate-700" />
            ) : (
              <Play className="w-6 h-6 text-slate-700 ml-1" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onReRecord}
            disabled={isSubmitting}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
              "bg-slate-100 text-slate-700 hover:bg-slate-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <RotateCcw className="w-5 h-5" />
            Re-record
          </button>

          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
              "bg-gradient-to-r from-teal-500 to-teal-600 text-white",
              "hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
              "disabled:opacity-70 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
