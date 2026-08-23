"use client";
// Wraps useRecorder into the record -> review -> submit UI with explicit states
// for unsupported / denied / requesting (doc 04 §4.3, §4.7). 30 s hard cap.
import { Mic, RotateCcw, Square } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { useRecorder } from "@/lib/use-recorder";
import { LevelMeter } from "./LevelMeter";

export function RecorderPanel({
  onSubmit,
  submitting = false,
  canRecord = true,
}: {
  onSubmit: (blob: Blob, mimeType: string) => void;
  submitting?: boolean;
  canRecord?: boolean;
}) {
  const { state, recording, analyser, elapsedMs, error, start, stop, reset } =
    useRecorder({ maxDurationMs: 30_000 });

  if (!canRecord) {
    return (
      <p className="rounded-md bg-zinc-100 p-3 text-sm text-zinc-500">
        Recording is available to students. Teachers can preview the drill text.
      </p>
    );
  }
  if (state === "unsupported") {
    return (
      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
        Your browser can’t record audio. Try a recent Chrome, Firefox, or Safari
        over HTTPS.
      </p>
    );
  }
  if (state === "denied") {
    return (
      <div className="space-y-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
        <p>
          Microphone blocked — enable it in your browser’s site settings.
          {error ? ` (${error})` : ""}
        </p>
        <Button size="sm" variant="outline" onClick={start}>
          Try again
        </Button>
      </div>
    );
  }

  const remaining = Math.max(0, 30 - Math.floor(elapsedMs / 1000));

  return (
    <div className="space-y-3">
      {state === "recording" && (
        <div className="space-y-1">
          <LevelMeter analyser={analyser} />
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Recording…
            </span>
            <span>{remaining}s left</span>
          </div>
        </div>
      )}
      {state === "recorded" && recording && (
        <audio controls src={recording.url} className="w-full" />
      )}

      <div className="flex flex-wrap gap-2">
        {state === "idle" && (
          <Button
            onClick={start}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            <Mic size={16} /> Record
          </Button>
        )}
        {state === "requesting" && (
          <Button disabled>
            <Spinner /> Waiting for mic…
          </Button>
        )}
        {state === "recording" && (
          <Button variant="danger" onClick={stop}>
            <Square size={16} /> Stop
          </Button>
        )}
        {state === "recorded" && recording && (
          <>
            <Button variant="outline" onClick={reset}>
              <RotateCcw size={16} /> Re-record
            </Button>
            <Button
              className="bg-teal-600 text-white hover:bg-teal-700"
              loading={submitting}
              onClick={() => onSubmit(recording.blob, recording.mimeType)}
            >
              Submit for scoring
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
