"use client";
// Student-facing "Explain my mistakes" panel. Loads the newest stored
// explanation (404 -> none yet) and lets the student generate / regenerate one.
import { useState } from "react";
import { Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { useGenerateMistakeExplanation, useMistakeExplanation } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { AiTag, Button, Card, Skeleton } from "@/components/ui";
import type { AiMistakeCategory } from "@/lib/types";
import { timeAgo } from "@/lib/format";

const CATEGORY_LABEL: Record<AiMistakeCategory, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  spelling: "Spelling",
  punctuation: "Punctuation",
  coherence: "Coherence",
  task_response: "Task response",
  comprehension: "Comprehension",
  inference: "Inference",
  detail: "Detail",
  other: "Other",
};

export function MistakeExplanationCard({
  submissionId,
  canGenerate = true,
}: {
  submissionId: number;
  canGenerate?: boolean;
}) {
  const insight = useMistakeExplanation(submissionId);
  const generate = useGenerateMistakeExplanation(submissionId);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    try {
      await generate.mutateAsync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not explain mistakes.");
    }
  };

  if (insight.isLoading) return <Skeleton className="h-24 w-full" />;

  const data = insight.data?.payload;

  return (
    <Card className="space-y-3 border-violet-200 bg-violet-50/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 font-bold text-violet-800">
            <Sparkles size={16} /> Understand your mistakes <AiTag />
          </h3>
          <p className="mt-0.5 text-xs text-violet-600">
            AI explains each mistake in plain language, with a correction and a tip.
          </p>
        </div>
        {canGenerate && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-violet-300 bg-white text-violet-700 hover:bg-violet-50"
            loading={generate.isPending}
            onClick={run}
          >
            {data ? (
              <span className="inline-flex items-center gap-1">
                <RefreshCw size={14} /> Regenerate
              </span>
            ) : (
              "Explain my mistakes"
            )}
          </Button>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {insight.isError && !error && (
        <p className="text-sm text-red-600">Couldn’t load the explanation.</p>
      )}

      {data && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-800">{data.summary}</p>

          {data.mistakes.length === 0 ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              No mistakes found. Nice work!
            </p>
          ) : (
            <ol className="space-y-2">
              {data.mistakes.map((m, i) => (
                <li
                  key={i}
                  className="rounded-md border border-violet-100 bg-white p-3 text-sm shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                      {CATEGORY_LABEL[m.category] ?? m.category}
                    </span>
                    <span className="font-medium text-zinc-800">{m.location}</span>
                  </div>
                  {(m.student_answer || m.correction) && (
                    <p className="mt-1.5 text-zinc-700">
                      {m.student_answer && (
                        <span className="text-red-600 line-through decoration-red-400">
                          {m.student_answer}
                        </span>
                      )}
                      {m.student_answer && m.correction && " → "}
                      {m.correction && (
                        <span className="font-semibold text-emerald-700">{m.correction}</span>
                      )}
                    </p>
                  )}
                  <p className="mt-1.5 text-zinc-700">{m.explanation}</p>
                  {m.tip && (
                    <p className="mt-1.5 flex items-start gap-1 text-xs text-zinc-500">
                      <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                      {m.tip}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}

          {data.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                What you did well
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-zinc-700">
                {data.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {data.practice_suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Practice next
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-zinc-700">
                {data.practice_suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-zinc-400">
            Generated {timeAgo(insight.data!.created_at)} · {insight.data!.engine}
          </p>
        </div>
      )}

      {!data && !canGenerate && (
        <p className="text-sm text-zinc-500">No explanation generated yet.</p>
      )}
    </Card>
  );
}
