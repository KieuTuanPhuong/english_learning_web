"use client";
// Mock-test catalog: published templates, this student's attempt history, and a
// resume banner for anything still in progress (the server refuses to start a
// second attempt while one is unfinished, so resuming is the only way back in).
import Link from "next/link";
import { ArrowRight, Clock, PlayCircle } from "lucide-react";
import { useMockTestTemplates, useMyTestAttempts } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import { dateLabel } from "@/lib/format";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import type { TestAttemptListItem } from "@/lib/types";

export default function MockTestsPage() {
  const { role } = useAuth();
  const templates = useMockTestTemplates();
  const attempts = useMyTestAttempts();
  const isStudent = role === "student";

  const inProgress = (attempts.data ?? []).find(
    (attempt) => attempt.status === "in_progress",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Mock tests"
        subtitle="Timed practice under exam conditions. Take any test, any time."
      />

      {isStudent && inProgress && <ResumeBanner attempt={inProgress} />}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700">Test library</h2>
        {templates.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : templates.isError ? (
          <ErrorState message="Couldn't load mock tests." />
        ) : (templates.data ?? []).length === 0 ? (
          <EmptyState
            title="The library is empty"
            hint="An administrator can stock it with `manage.py seed_mock_tests`."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(templates.data ?? []).map((template) => (
              <li key={template.id}>
                <Link href={`/mock-tests/${template.id}`} className="block">
                  <Card className="h-full space-y-2 transition hover:border-accent/50">
                    <h3 className="font-semibold">{template.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <Badge>{template.format_name}</Badge>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} aria-hidden />
                        {template.total_duration_minutes} min
                      </span>
                      <span>{(template.sections ?? []).length} sections</span>
                    </div>
                    {template.description && (
                      <p className="line-clamp-2 text-sm text-zinc-600">
                        {template.description}
                      </p>
                    )}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isStudent && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700">My attempts</h2>
          {attempts.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (attempts.data ?? []).length === 0 ? (
            <EmptyState title="No attempts yet" hint="Pick a test above to start." />
          ) : (
            <ul className="space-y-2">
              {(attempts.data ?? []).map((attempt) => (
                <li key={attempt.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-48 flex-1">
                      <p className="font-medium">{attempt.template_title}</p>
                      <p className="text-xs text-zinc-500">
                        Started {dateLabel(attempt.started_at)}
                      </p>
                      <AttemptProgress
                        completed={attempt.sections_completed}
                        total={attempt.sections_total}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      {attempt.overall_score != null && (
                        <span className="font-mono text-sm font-semibold">
                          {attempt.overall_score}
                        </span>
                      )}
                      <Badge
                        kind={attempt.status === "completed" ? "graded" : "pending"}
                      >
                        {attempt.status === "in_progress"
                          ? "in progress"
                          : attempt.status}
                      </Badge>
                      <Link
                        href={
                          attempt.status === "in_progress"
                            ? `/mock-tests/attempts/${attempt.id}`
                            : `/mock-tests/attempts/${attempt.id}/report`
                        }
                        className="inline-flex items-center gap-1 text-sm font-medium text-accent"
                      >
                        {attempt.status === "in_progress" ? "Resume" : "Report"}
                        <ArrowRight size={14} aria-hidden />
                      </Link>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

/** Sections finished on an attempt. Deliberately counts *sections*, not
 *  questions: a student mid-Reading wants to know how much of the test is left,
 *  and the section timer already tells them about the part in hand. */
function AttemptProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  if (!total) return null;
  const percent = Math.round((completed / total) * 100);
  return (
    <div className="mt-2 max-w-xs">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-label={`${completed} of ${total} sections complete`}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {completed} of {total} sections complete
      </p>
    </div>
  );
}

function ResumeBanner({ attempt }: { attempt: TestAttemptListItem }) {
  return (
    <Card accent className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-semibold">Test in progress</p>
        <p className="text-sm text-zinc-600">
          {attempt.template_title} — your section timer keeps running while you
          are away.
        </p>
      </div>
      <Link
        href={`/mock-tests/attempts/${attempt.id}`}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        <PlayCircle size={16} aria-hidden />
        Resume test
      </Link>
    </Card>
  );
}
