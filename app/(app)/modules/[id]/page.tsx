"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import {
  useModule,
  useModuleExercises,
  useMyProgress,
  useMySubmissions,
} from "@/lib/hooks";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  ProgressBar,
  Skeleton,
} from "@/components/ui";
import { bandLabel, parseDecimal } from "@/lib/format";

export default function ModuleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const moduleQ = useModule(id);
  const exercises = useModuleExercises(id);
  const progress = useMyProgress();
  const submissions = useMySubmissions();

  const pct =
    parseDecimal(
      progress.data?.find((p) => p.module_id === id)?.completion_percentage,
    ) ?? 0;
  const submittedExerciseIds = new Set(
    (submissions.data ?? []).map((s) => s.exercise_id),
  );

  return (
    <div className="space-y-4">
      <Link
        href="/modules"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ChevronLeft size={16} /> Catalog
      </Link>

      {moduleQ.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : moduleQ.isError || !moduleQ.data ? (
        <ErrorState message="Couldn’t load this module." />
      ) : (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold">{moduleQ.data.title}</h1>
            <div className="flex flex-wrap justify-end gap-1">
              {moduleQ.data.difficulty_level && (
                <Badge kind={moduleQ.data.difficulty_level}>
                  {moduleQ.data.difficulty_level}
                </Badge>
              )}
              {moduleQ.data.band && (
                <Badge kind="band">{bandLabel(moduleQ.data.band)}</Badge>
              )}
              {moduleQ.data.topic && (
                <Badge kind={moduleQ.data.topic}>{moduleQ.data.topic}</Badge>
              )}
            </div>
          </div>
          {moduleQ.data.description && (
            <p className="text-sm text-zinc-600">{moduleQ.data.description}</p>
          )}
          {progress.data && <ProgressBar value={pct} />}
        </div>
      )}

      <h2 className="text-sm font-semibold text-zinc-700">Exercises</h2>
      {exercises.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : exercises.isError ? (
        <ErrorState message="Couldn’t load exercises." />
      ) : (exercises.data ?? []).length === 0 ? (
        <EmptyState title="No exercises yet" />
      ) : (
        <div className="space-y-2">
          {(exercises.data ?? []).map((ex, i) => {
            const done = submittedExerciseIds.has(ex.id);
            return (
              <Link key={ex.id} href={`/exercises/${ex.id}`} className="block">
                <Card className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={done ? "text-emerald-600" : "text-zinc-300"}>
                      {done ? "✓" : "○"}
                    </span>
                    <span className="font-medium">
                      {i + 1}. {ex.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ex.questions && ex.questions.length > 0 && (
                      <Badge className="bg-zinc-100 text-zinc-600">{ex.questions.length} Qs</Badge>
                    )}
                    {ex.band && <Badge kind="band">{bandLabel(ex.band)}</Badge>}
                    {ex.topic && <Badge kind={ex.topic}>{ex.topic}</Badge>}
                    <Badge kind={ex.exercise_type}>{ex.exercise_type}</Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
