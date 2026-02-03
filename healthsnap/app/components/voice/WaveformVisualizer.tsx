"use client";

import { useRef, useEffect, memo } from "react";
import { type WaveformVisualizerProps } from "./types";
import { cn } from "@/app/lib/utils";

export const WaveformVisualizer = memo(function WaveformVisualizer({
  analyser,
  isActive,
  className,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerY = height / 2;

    // Number of bars
    const barCount = 40;
    const barWidth = width / barCount - 2;
    const barGap = 2;

    function drawIdleWaveform() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle idle bars
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + barGap);
        const barHeight = 4 + Math.sin(Date.now() / 500 + i * 0.3) * 2;

        // Gradient color
        const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        gradient.addColorStop(0, "rgba(20, 184, 166, 0.3)");
        gradient.addColorStop(0.5, "rgba(20, 184, 166, 0.5)");
        gradient.addColorStop(1, "rgba(20, 184, 166, 0.3)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, 2);
        ctx.fill();
      }
    }

    function drawActiveWaveform() {
      if (!ctx || !analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      // Sample the frequency data
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + barGap);

        // Average a range of frequencies for smoother visualization
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j];
        }
        const avg = sum / step;

        // Scale the bar height
        const normalizedValue = avg / 255;
        const minHeight = 4;
        const maxHeight = height * 0.8;
        const barHeight = minHeight + normalizedValue * (maxHeight - minHeight);

        // Gradient based on intensity
        const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);

        if (normalizedValue > 0.7) {
          // High intensity - more vibrant
          gradient.addColorStop(0, "rgba(20, 184, 166, 0.9)");
          gradient.addColorStop(0.5, "rgba(6, 182, 212, 1)");
          gradient.addColorStop(1, "rgba(20, 184, 166, 0.9)");
        } else if (normalizedValue > 0.4) {
          // Medium intensity
          gradient.addColorStop(0, "rgba(20, 184, 166, 0.6)");
          gradient.addColorStop(0.5, "rgba(20, 184, 166, 0.8)");
          gradient.addColorStop(1, "rgba(20, 184, 166, 0.6)");
        } else {
          // Low intensity
          gradient.addColorStop(0, "rgba(20, 184, 166, 0.3)");
          gradient.addColorStop(0.5, "rgba(20, 184, 166, 0.5)");
          gradient.addColorStop(1, "rgba(20, 184, 166, 0.3)");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 3);
        ctx.fill();
      }
    }

    function animate() {
      if (isActive && analyser) {
        drawActiveWaveform();
      } else {
        drawIdleWaveform();
      }
      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive]);

  return (
    <div
      className={cn(
        "w-full rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 overflow-hidden",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-24 sm:h-32"
        style={{ display: "block" }}
      />
    </div>
  );
});
