"use client";
// Replaces the holistic score field when a rubric resolves. Cell selections
// live in local state; comments in a plain controlled field; the assembled
// payload is zod-validated in the submit handler (safeParse) before posting.
// No `score` is sent — the server computes it from criterion_scores (doc 02).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateFeedback } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { Button, Card, TextArea, TextField } from "@/components/ui";
import type { RubricTemplate } from "@/lib/types";
import { RubricMatrix, type CellPreview } from "./RubricMatrix";
import { BandDescriptorPanel } from "./BandDescriptorPanel";
import { OverallScorePreview } from "./OverallScorePreview";
import { buildGradeFormSchema } from "./schemas";
import { FeedbackReviewPanel } from "@/components/ai/FeedbackReviewPanel";

export function RubricGradeForm({
  submissionId,
  template,
  onUseHolistic,
}: {
  submissionId: number;
  template: RubricTemplate;
  onUseHolistic: () => void;
}) {
  const router = useRouter();
  const createFeedback = useCreateFeedback();
  const [scores, setScores] = useState<Record<number, number | undefined>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [comments, setComments] = useState("");
  const [preview, setPreview] = useState<CellPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const values = template.criteria
    .map((c) => scores[c.id])
    .filter((v): v is number => v != null);
  const allScored = values.length === template.criteria.length;

  const select = (criterionId: number, band: number) =>
    setScores((prev) => ({
      ...prev,
      [criterionId]: prev[criterionId] === band ? undefined : band,
    }));

  const onSubmit = async () => {
    setError(null);
    const criterion_scores = template.criteria
      .filter((c) => scores[c.id] != null)
      .map((c) => ({
        criterion_id: c.id,
        score: scores[c.id] as number,
        note: notes[c.id]?.trim() ? notes[c.id].trim() : undefined,
      }));
    const parsed = buildGradeFormSchema(template).safeParse({
      criterion_scores,
      comments,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please complete the rubric.");
      return;
    }
    try {
      await createFeedback.mutateAsync({
        submission_id: submissionId,
        // Validated as numbers above (the band picker and the step check are
        // numeric); decimals cross the wire as strings, so convert here at the
        // boundary rather than weakening the schema.
        criterion_scores: criterion_scores.map((row) => ({
          ...row,
          score: String(row.score),
        })),
        comments,
      });
      router.push("/submissions");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to submit feedback.",
      );
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-zinc-800">Grade with rubric</h3>
          <p className="text-xs text-zinc-500">{template.name}</p>
        </div>
        <button
          type="button"
          onClick={onUseHolistic}
          className="shrink-0 text-xs text-zinc-500 underline hover:text-zinc-700"
        >
          Grade without rubric
        </button>
      </div>

      <RubricMatrix
        template={template}
        scores={scores}
        onSelect={select}
        onPreview={setPreview}
      />
      <BandDescriptorPanel preview={preview} />

      <details className="rounded-md border border-zinc-200 p-2">
        <summary className="cursor-pointer text-xs font-medium text-zinc-600">
          Per-criterion notes (optional)
        </summary>
        <div className="mt-2 space-y-2">
          {template.criteria.map((c) => (
            <TextField
              key={c.id}
              label={c.name}
              placeholder="Optional note for this criterion"
              value={notes[c.id] ?? ""}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
              }
            />
          ))}
        </div>
      </details>

      {allScored && <OverallScorePreview template={template} values={values} />}

      <TextArea
        label="Comments"
        placeholder="Write your constructive feedback here..."
        rows={4}
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />

      <FeedbackReviewPanel
        submissionId={submissionId}
        getDraft={() => {
          const criterion_scores = template.criteria
            .filter((c) => scores[c.id] != null)
            .map((c) => ({
              criterion_id: c.id,
              score: String(scores[c.id]),
              note: notes[c.id]?.trim() || undefined,
            }));
          if (!comments.trim() && criterion_scores.length === 0) return null;
          return { comments, criterion_scores };
        }}
        onUseSuggestion={setComments}
      />

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <Button
        type="button"
        onClick={onSubmit}
        className="w-full bg-teal-600 text-white hover:bg-teal-700"
        loading={createFeedback.isPending}
        disabled={!allScored || !comments.trim()}
      >
        Submit rubric grade
      </Button>
    </Card>
  );
}
