"use client";
// Hand-rolled canvas level meter off the recorder's AnalyserNode (doc 04 §3.2):
// live "it's hearing you" feedback, ~zero deps. Torn down when analyser clears.
import { useEffect, useRef } from "react";

export function LevelMeter({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;

    const draw = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const level = Math.min(1, Math.sqrt(sum / data.length) * 3);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#14b8a6"; // teal-500
      ctx.fillRect(0, 0, canvas.width * level, canvas.height);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={12}
      className="h-3 w-full rounded bg-zinc-200"
      aria-hidden
    />
  );
}
