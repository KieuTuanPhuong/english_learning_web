"use client";
import { Card } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { PronunciationAttempt } from "@/lib/types";

export function AttemptHistory({
  attempts,
}: {
  attempts: PronunciationAttempt[];
}) {
  if (attempts.length === 0) return null;
  return (
    <Card className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-700">Attempt history</h3>
      <ul className="space-y-1.5">
        {attempts.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="text-xs text-zinc-500">{timeAgo(a.created_at)}</span>
            <span className="font-medium text-zinc-700">
              {a.overall_score != null
                ? Math.round(Number(a.overall_score))
                : "—"}
              /100
            </span>
            {a.audio_url && (
              <audio controls src={a.audio_url} className="h-8 max-w-[160px]" />
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
