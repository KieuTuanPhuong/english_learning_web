"use client";
// Teacher-facing "Review with AI" panel: sends the draft grade to the backend
// reviewer and shows rating, strengths, recommendations and a suggested rewrite
// the teacher can copy into the comments box. Stateless on the server.
import { useState } from "react";
import { Sparkles, Star } from "lucide-react";
import { useAiReviewFeedback } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { AiTag, Button } from "@/components/ui";
import type { AiReviewArea, FeedbackReview, FeedbackReviewRequest } from "@/lib/types";

const AREA_LABEL: Record<AiReviewArea, string> = {
  specificity: "Specificity",
  tone: "Tone",
  actionability: "Actionability",
  accuracy: "Accuracy",
  coverage: "Coverage",
  score_alignment: "Score alignment",
  language_level: "Language level",
};

export function FeedbackReviewPanel({
  submissionId,
  getDraft,
  onUseSuggestion,
}: {
  submissionId: number;
  /** Called on click; return null to skip (e.g. nothing written yet). */
  getDraft: () => FeedbackReviewRequest | null;
  onUseSuggestion: (text: string) => void;
}) {
  const review = useAiReviewFeedback(submissionId);
  const [result, setResult] = useState<FeedbackReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    const draft = getDraft();
    if (!draft) {
      setError("Write a comment or pick a score first.");
      return;
    }
    try {
      setResult(await review.mutateAsync(draft));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "AI review failed.");
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-violet-200 bg-violet-50/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-violet-800">
            <Sparkles size={14} /> Review my feedback <AiTag />
          </p>
          <p className="text-xs text-violet-600">
            Get recommendations before you send this to the student.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-violet-300 bg-white text-violet-700 hover:bg-violet-50"
          loading={review.isPending}
          onClick={run}
        >
          {result ? "Review again" : "Review with AI"}
        </Button>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {result && (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5" aria-label={`Rating ${result.rating} of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={14}
                  className={n <= result.rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"}
                />
              ))}
            </span>
            <span className="text-zinc-700">{result.summary}</span>
          </div>

          {result.strengths.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-emerald-700">
              {result.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}

          {result.recommendations.length > 0 && (
            <ol className="space-y-2">
              {result.recommendations.map((r, i) => (
                <li key={i} className="rounded-md border border-violet-100 bg-white p-2.5 shadow-sm">
                  <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                    {AREA_LABEL[r.area] ?? r.area}
                  </span>
                  <p className="mt-1 text-zinc-700">{r.issue}</p>
                  <p className="mt-1 text-zinc-900">
                    <span className="font-semibold">Try:</span> {r.suggestion}
                  </p>
                </li>
              ))}
            </ol>
          )}

          <p className="text-xs text-zinc-600">
            <span className="font-semibold">Score alignment:</span> {result.score_alignment}
          </p>

          {result.suggested_comment && (
            <div className="rounded-md border border-dashed border-violet-300 bg-white p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Suggested rewrite
              </p>
              <p className="mt-1 whitespace-pre-wrap text-zinc-800">{result.suggested_comment}</p>
              <button
                type="button"
                onClick={() => onUseSuggestion(result.suggested_comment)}
                className="mt-2 text-xs font-medium text-violet-700 underline hover:text-violet-900"
              >
                Use this text
              </button>
            </div>
          )}

          <p className="text-[11px] text-zinc-400">{result.engine}</p>
        </div>
      )}
    </div>
  );
}
