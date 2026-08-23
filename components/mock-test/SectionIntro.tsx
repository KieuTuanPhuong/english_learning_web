"use client";
// Pre-section screen. "Start section" is the moment the server clock starts —
// not attempt creation — so the rules are spelled out before the student
// commits to the countdown.
import { AlertTriangle, Clock } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import type { SectionAttempt } from "@/lib/types";

export function SectionIntro({
  section,
  index,
  total,
  onStart,
  onBack,
  starting,
  error,
}: {
  section: SectionAttempt;
  index: number;
  total: number;
  onStart: () => void;
  /** Free-order attempts only: return to the picker without starting a clock,
   *  so choosing a section is never a one-way door. */
  onBack?: () => void;
  starting?: boolean;
  error?: string | null;
}) {
  const isListening = section.skill === "listening";
  // `exercises` is empty until the section starts — content is withheld so a
  // later section's passages are not handed out early — so the part count is
  // only shown when the server has already sent them.
  const partCount = (section.exercises ?? []).length;
  const gated = section.item_flow === "sequential";

  return (
    <div className="mx-auto max-w-2xl py-10">
      <Card className="space-y-6 p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Section {index + 1} of {total}
          </p>
          <h1 className="text-2xl font-bold">{section.title}</h1>
          <Badge kind={section.skill}>{section.skill}</Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-700">
          <Clock size={16} aria-hidden />
          <span className="font-semibold">{section.duration_minutes} minutes</span>
        </div>

        {section.instructions && (
          <p className="whitespace-pre-wrap text-sm text-zinc-700">
            {section.instructions}
          </p>
        )}

        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} aria-hidden /> Before you start
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              The timer starts the moment you press Start and runs on the server —
              closing the tab does not pause it.
            </li>
            <li>You cannot return to this section once you submit it.</li>
            {gated && (
              <li>
                This section runs one part at a time
                {partCount > 1 ? ` (${partCount} parts)` : ""}. Once you move on
                you cannot go back to an earlier part.
              </li>
            )}
            {isListening && <li>The audio plays once only. There is no replay.</li>}
            <li>Your answers save automatically every few seconds.</li>
          </ul>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={onStart} loading={starting} className="w-full">
          Start section
        </Button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={starting}
            className="w-full text-sm text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
          >
            Choose a different section
          </button>
        )}
      </Card>
    </div>
  );
}
