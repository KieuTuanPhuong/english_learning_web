"use client";
// Read-only criterion breakdown inside a student's feedback card. Lazily
// fetches the template for names/descriptors; renders nothing when the row
// carries no criterion scores (holistic feedback).
import { useState } from "react";
import { useRubric } from "@/lib/hooks";
import type { Feedback } from "@/lib/types";

export function RubricBreakdown({ feedback }: { feedback: Feedback }) {
  const scores = feedback.criterion_scores ?? [];
  const { data: template } = useRubric(feedback.rubric_template_id ?? undefined);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (scores.length === 0) return null;

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Rubric breakdown
      </p>
      <div className="space-y-1">
        {scores.map((s) => {
          const criterion = template?.criteria.find(
            (c) => c.id === s.criterion_id,
          );
          const band = Number(s.score);
          const descriptor = criterion?.band_descriptors.find(
            (d) => Number(d.band_value) === band,
          );
          const name = criterion?.name ?? `Criterion ${s.criterion_id}`;
          const label = descriptor?.label || `Band ${s.score}`;
          const open = expanded.has(s.id);
          return (
            <div key={s.id}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
              >
                {name} — {label}
              </button>
              {open && (descriptor || s.note) && (
                <div className="mt-1 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-600">
                  {descriptor && (
                    <p className="whitespace-pre-wrap">{descriptor.descriptor}</p>
                  )}
                  {s.note && (
                    <p className="mt-1 italic text-zinc-500">Note: {s.note}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
