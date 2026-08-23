"use client";
// Drill player: target + IPA, recorder, scored result, attempt history. The
// synchronous 201 response IS the scored attempt (backend §3.4).
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { Badge, Card, ErrorState, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import {
  useDrillAttempts,
  usePronunciationDrill,
  useSubmitAttempt,
} from "@/lib/hooks";
import type { PronunciationAttempt } from "@/lib/types";
import { RecorderPanel } from "@/components/pronunciation/RecorderPanel";
import { AttemptResult } from "@/components/pronunciation/AttemptResult";
import { AttemptHistory } from "@/components/pronunciation/AttemptHistory";

export default function DrillPlayerPage() {
  const params = useParams<{ drillId: string }>();
  const drillId = Number(params.drillId);
  const { role } = useAuth();
  const drill = usePronunciationDrill(drillId);
  const attempts = useDrillAttempts(drillId);
  const submit = useSubmitAttempt(drillId);
  const [result, setResult] = useState<PronunciationAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (blob: Blob, mimeType: string) => {
    setError(null);
    try {
      const attempt = await submit.mutateAsync({ audio: blob, mimeType });
      setResult(attempt);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("You’re practicing fast! Try again in a few minutes.");
      } else if (err instanceof ApiError && err.fieldErrors) {
        setError(Object.values(err.fieldErrors)[0]?.[0] ?? err.message);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "Scoring failed. Your recording is kept — try submitting again.",
        );
      }
    }
  };

  if (drill.isLoading) return <Skeleton className="h-64 w-full" />;
  if (drill.isError || !drill.data)
    return <ErrorState message="Drill not found." />;

  const d = drill.data;
  const canRecord = role === "student";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/pronunciation"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ChevronLeft size={16} /> Practice hub
      </Link>

      <Card className="space-y-2">
        <Badge kind={d.drill_type === "minimal_pair" ? undefined : d.drill_type}>
          {d.drill_type.replace("_", " ")}
        </Badge>
        <h1 className="text-3xl font-bold text-zinc-800">{d.target_text}</h1>
        {d.drill_type === "minimal_pair" && d.contrast_text && (
          <p className="text-sm text-zinc-600">
            Say: <strong>{d.target_text}</strong> — not <em>{d.contrast_text}</em>
          </p>
        )}
        {d.phoneme_hint && (
          <p className="font-mono text-sm text-zinc-400">{d.phoneme_hint}</p>
        )}
      </Card>

      <Card className="space-y-3">
        <RecorderPanel
          onSubmit={onSubmit}
          submitting={submit.isPending}
          canRecord={canRecord}
        />
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      </Card>

      {result && <AttemptResult attempt={result} />}
      <AttemptHistory attempts={attempts.data ?? []} />
    </div>
  );
}
