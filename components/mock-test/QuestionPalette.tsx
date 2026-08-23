"use client";
// Numbered grid across every question in the section (IELTS numbers run across
// passages, not per passage — see lib/mock-tests.ts:buildPalette).
import { cn } from "@/lib/cn";
import type { PaletteEntry } from "@/lib/mock-tests";

const stateStyles: Record<PaletteEntry["state"], string> = {
  current: "border-accent bg-accent text-accent-foreground",
  answered: "border-emerald-300 bg-emerald-50 text-emerald-800",
  unanswered: "border-zinc-300 bg-white text-zinc-500 hover:border-zinc-400",
};

export function QuestionPalette({
  entries,
  onJump,
}: {
  entries: PaletteEntry[];
  onJump: (questionId: number) => void;
}) {
  const answered = entries.filter((entry) => entry.state === "answered").length;

  return (
    <nav aria-label="Question navigation" className="space-y-2">
      <p className="text-xs font-medium text-zinc-500">
        {answered} of {entries.length} answered
      </p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map((entry) => (
          <button
            key={entry.questionId}
            type="button"
            onClick={() => onJump(entry.questionId)}
            aria-label={`Question ${entry.number}, ${entry.state}`}
            className={cn(
              "h-8 w-8 rounded-md border text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/40",
              stateStyles[entry.state],
            )}
          >
            {entry.number}
          </button>
        ))}
      </div>
    </nav>
  );
}
