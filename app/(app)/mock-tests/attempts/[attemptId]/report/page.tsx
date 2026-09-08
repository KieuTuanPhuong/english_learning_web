"use client";
// Score report. Renders partial results honestly: Listening/Reading bands are
// there the moment the section is submitted, Writing/Speaking show "Pending
// grading" until the AI (or a teacher) scores them, and the overall score only
// appears once every section has one.
//
// AI marking: the server claims every submitted section for automatic marking
// the moment it is submitted; this page is the catch-up path. A completed
// section still `pending` (an attempt from before auto-marking, or a server
// that restarted mid-way) is sent to POST /ai-grade/ once on load, a `failed`
// one gets a Retry, and the report polls while anything is `running`.
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Clock, Info, RefreshCw } from "lucide-react";
import { useAiGradeTestAttempt, useTestAttemptReport } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { dateLabel } from "@/lib/format";
import { isReceptive } from "@/lib/mock-tests";
import {
  AiTag,
  Badge,
  Button,
  Card,
  ErrorState,
  PageHeader,
  Skeleton,
  Spinner,
} from "@/components/ui";
import { SubmissionReviewList } from "@/components/mock-test/SectionReview";
import type { SectionScore } from "@/lib/types";

export default function TestAttemptReportPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = Number(params.attemptId);
  const report = useTestAttemptReport(attemptId);
  const aiGrade = useAiGradeTestAttempt(attemptId);
  const { mutate: startAiGrading } = aiGrade;

  // Catch-up: claim marking for completed sections nobody has claimed. Once
  // per page load — the endpoint is idempotent, but firing it on every poll
  // would hammer it while a section is legitimately still queued.
  const autoStarted = useRef(false);
  const needsAi =
    report.data?.sections.some(
      (section) => section.status === "completed" && section.ai_status === "pending",
    ) ?? false;
  useEffect(() => {
    if (!needsAi || autoStarted.current) return;
    autoStarted.current = true;
    startAiGrading();
  }, [needsAi, startAiGrading]);

  if (report.isLoading) return <Skeleton className="h-64 w-full" />;
  if (report.isError || !report.data) {
    return <ErrorState message="Couldn't load this score report." />;
  }

  const data = report.data;
  const marking =
    aiGrade.isPending || data.sections.some((section) => section.ai_status === "running");
  const aiError = aiGrade.isError
    ? aiGrade.error instanceof ApiError
      ? aiGrade.error.message
      : "Could not start AI marking."
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/mock-tests"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ChevronLeft size={16} aria-hidden /> Back to mock tests
      </Link>

      <PageHeader
        title={data.template_title}
        subtitle={
          data.completed_at
            ? `Completed ${dateLabel(data.completed_at)}`
            : "In progress"
        }
      />

      <OverallScoreCard
        score={data.overall_score}
        partial={data.partial}
        marking={marking}
        format={data.format}
      />

      {aiError && <p className="text-sm font-medium text-red-600">{aiError}</p>}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700">By section</h2>
        <ul className="space-y-2">
          {data.sections.map((section) => (
            <li key={section.section_attempt_id}>
              <SectionScoreCard
                section={section}
                retrying={aiGrade.isPending}
                onRetry={() => startAiGrading()}
              />
            </li>
          ))}
        </ul>
      </section>

      {data.estimated && (
        <p className="flex items-start gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            Scores are <strong>estimates</strong>. Neither IELTS nor ETS
            publishes official raw-to-score conversion tables, so these use
            widely-cited approximations and will not match an official result
            exactly. Writing and Speaking bands come from AI marking unless a
            teacher has graded the task.
          </span>
        </p>
      )}
    </div>
  );
}

function OverallScoreCard({
  score,
  partial,
  marking,
  format,
}: {
  score: string | null;
  partial: boolean;
  marking: boolean;
  format: string;
}) {
  const isBand = format.startsWith("ielts");
  return (
    <Card accent className="flex items-center justify-between gap-4 p-6">
      <div>
        <p className="text-sm font-semibold text-zinc-700">
          {isBand ? "Overall band" : "Total score"}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {!partial
            ? "All sections scored."
            : marking
              ? "The AI is marking your sections — this updates automatically."
              : "Waiting on Writing/Speaking grading — this updates automatically."}
        </p>
      </div>
      <div className="text-right">
        {score != null ? (
          <span className="font-mono text-4xl font-bold">{trimScore(score)}</span>
        ) : (
          <Badge kind="pending">Pending</Badge>
        )}
      </div>
    </Card>
  );
}

function SectionScoreCard({
  section,
  retrying,
  onRetry,
}: {
  section: SectionScore;
  retrying: boolean;
  onRetry: () => void;
}) {
  const notStarted = section.status === "not_started";
  const completed = section.status === "completed";
  const receptive = isReceptive(section.skill);
  // Only receptive sections have a raw count to draw. Writing and Speaking are
  // a band from a rubric, not a proportion, and inventing a bar for them would
  // imply a precision the mark does not have.
  const hasRawBar =
    section.raw_max != null && section.raw_max > 0 && section.raw_score != null;
  const percent = hasRawBar
    ? Math.round(((section.raw_score ?? 0) / (section.raw_max ?? 1)) * 100)
    : 0;
  const wrongCount = receptive
    ? section.submissions.reduce(
        (sum, task) => sum + task.questions.filter((q) => q.is_correct === false).length,
        0,
      )
    : 0;

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{section.title}</p>
            <Badge kind={section.skill}>{section.skill}</Badge>
          </div>
          {hasRawBar ? (
            <p className="text-xs text-zinc-500">
              {section.raw_score} of {section.raw_max} correct ({percent}%)
            </p>
          ) : notStarted ? (
            <p className="text-xs text-zinc-500">Not attempted</p>
          ) : section.pending_grading ? (
            <p className="inline-flex items-center gap-1 text-xs text-amber-700">
              <Clock size={12} aria-hidden /> Awaiting grading
            </p>
          ) : null}
        </div>

        {section.converted_score != null ? (
          <span className="font-mono text-2xl font-semibold">
            {trimScore(section.converted_score)}
          </span>
        ) : (
          <Badge kind="pending">
            {notStarted ? "Not taken" : "Pending grading"}
          </Badge>
        )}
      </div>

      {hasRawBar && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={section.raw_max ?? 0}
          aria-valuenow={section.raw_score ?? 0}
          aria-label={`${section.title}: ${section.raw_score} of ${section.raw_max} correct`}
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {completed && (
        <AiMarkingStatus section={section} retrying={retrying} onRetry={onRetry} />
      )}

      {completed && section.submissions.length > 0 && (
        // Open by default when there is something to learn from; a perfect
        // section or a productive task stays folded to keep the report short.
        <details open={receptive && wrongCount > 0}>
          <summary className="cursor-pointer select-none text-sm font-medium text-accent">
            Review answers
            {receptive
              ? wrongCount > 0
                ? ` · ${wrongCount} to fix`
                : " · all correct"
              : ""}
          </summary>
          <div className="mt-3">
            <SubmissionReviewList submissions={section.submissions} receptive={receptive} />
          </div>
        </details>
      )}
    </Card>
  );
}

function AiMarkingStatus({
  section,
  retrying,
  onRetry,
}: {
  section: SectionScore;
  retrying: boolean;
  onRetry: () => void;
}) {
  switch (section.ai_status) {
    case "running":
      return (
        <p className="inline-flex items-center gap-2 text-xs text-violet-700">
          <Spinner className="h-3.5 w-3.5" /> The AI is marking this section…
        </p>
      );
    case "failed":
      return (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50/50 px-3 py-2 text-xs text-red-700">
          <span>AI marking failed{section.ai_error ? `: ${section.ai_error}` : "."}</span>
          <Button variant="outline" size="sm" loading={retrying} onClick={onRetry}>
            <RefreshCw size={12} aria-hidden /> Retry
          </Button>
        </div>
      );
    case "pending":
      return (
        <p className="inline-flex items-center gap-2 text-xs text-zinc-500">
          <Spinner className="h-3.5 w-3.5" /> Queuing AI marking…
        </p>
      );
    default:
      return (
        <p className="inline-flex items-center gap-1.5 text-xs text-violet-700">
          <AiTag /> Marked by AI
        </p>
      );
  }
}

/** Decimals arrive as strings ("7.00", "495.00"). Show bands as 7.0 and scaled
 *  scores as 495 — the precision each format actually reports. */
function trimScore(value: string): string {
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) return value;
  return Number.isInteger(asNumber) && Math.abs(asNumber) >= 10
    ? String(asNumber)
    : asNumber.toFixed(1);
}
