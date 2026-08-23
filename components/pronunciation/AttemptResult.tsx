"use client";
// Scored feedback: overall + dimension bars, then per-word chips colored by
// threshold with expandable phoneme detail (doc 04 §4.2). Color is always
// paired with a number and an error label — never color alone (§4.7).
import { useState } from "react";
import { Card, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { parseWordResults, scoreTone, type WordResult } from "@/lib/pronunciation";
import type { PronunciationAttempt, Strictness } from "@/lib/types";

const TONE_CLASSES: Record<"green" | "amber" | "red", string> = {
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
};

function num(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function AttemptResult({ attempt }: { attempt: PronunciationAttempt }) {
  const words = parseWordResults(attempt.word_results);
  const strictness = attempt.strictness ?? "standard";
  return (
    <Card className="space-y-4">
      <ScoreSummary attempt={attempt} />
      {words ? (
        <div className="flex flex-wrap gap-1.5">
          {words.map((w, i) => (
            <WordChip key={i} word={w} strictness={strictness} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-400">
          Per-word breakdown unavailable for this attempt.
        </p>
      )}
    </Card>
  );
}

function Bar({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function ScoreSummary({ attempt }: { attempt: PronunciationAttempt }) {
  const overall = num(attempt.overall_score);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-teal-700">
          {overall != null ? Math.round(overall) : "—"}
        </span>
        <span className="text-sm text-zinc-500">/100 overall</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <Bar label="Accuracy" value={num(attempt.accuracy_score)} />
        <Bar label="Fluency" value={num(attempt.fluency_score)} />
        <Bar label="Completeness" value={num(attempt.completeness_score)} />
        <Bar label="Prosody" value={num(attempt.prosody_score)} />
      </div>
    </div>
  );
}

function WordChip({
  word,
  strictness,
}: {
  word: WordResult;
  strictness: Strictness;
}) {
  const [open, setOpen] = useState(false);
  const tone = scoreTone(word.accuracy, strictness);
  const hasPhonemes = word.phonemes.length > 0;
  const errored = word.error_type && word.error_type !== "None";
  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => hasPhonemes && setOpen((o) => !o)}
        className={cn(
          "rounded px-2 py-1 text-xs font-medium",
          TONE_CLASSES[tone],
          word.error_type === "Omission" && "line-through",
          word.error_type === "Insertion" && "border border-dashed border-current",
          hasPhonemes && "cursor-pointer",
        )}
      >
        {word.word} <span className="opacity-70">{Math.round(word.accuracy)}</span>
        {errored && <span className="ml-1 opacity-70">· {word.error_type}</span>}
      </button>
      {open && hasPhonemes && (
        <div className="mt-1 flex flex-wrap gap-1 rounded-md border border-zinc-200 bg-white p-1.5">
          {word.phonemes.map((p, i) => (
            <span
              key={i}
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[0.7rem]",
                TONE_CLASSES[scoreTone(p.accuracy, strictness)],
              )}
            >
              /{p.phoneme}/ {Math.round(p.accuracy)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
