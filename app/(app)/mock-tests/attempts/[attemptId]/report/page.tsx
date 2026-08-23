"use client";
// Score report. Renders partial results honestly: Listening/Reading bands are
// there the moment the section is submitted, Writing/Speaking show "Pending
// grading" until a teacher or the AI scores them, and the overall score only
// appears once every section has one. Polls while `partial` is true.
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Clock, Info } from "lucide-react";
import { useTestAttemptReport } from "@/lib/hooks";
import { dateLabel } from "@/lib/format";
import { Badge, Card, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import type { SectionScore } from "@/lib/types";

export default function TestAttemptReportPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = Number(params.attemptId);
  const report = useTestAttemptReport(attemptId);

  if (report.isLoading) return <Skeleton className="h-64 w-full" />;
  if (report.isError || !report.data) {
    return <ErrorState message="Couldn't load this score report." />;
  }

  const data = report.data;

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
        format={data.format}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700">By section</h2>
        <ul className="space-y-2">
          {data.sections.map((section) => (
            <li key={section.section_attempt_id}>
              <SectionScoreCard section={section} />
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
            exactly.
          </span>
        </p>
      )}
    </div>
  );
}

function OverallScoreCard({
  score,
  partial,
  format,
}: {
  score: string | null;
  partial: boolean;
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
          {partial
            ? "Waiting on Writing/Speaking grading — this updates automatically."
            : "All sections scored."}
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

function SectionScoreCard({ section }: { section: SectionScore }) {
  const notStarted = section.status === "not_started";
  // Only receptive sections have a raw count to draw. Writing and Speaking are
  // a band from a rubric, not a proportion, and inventing a bar for them would
  // imply a precision the mark does not have.
  const hasRawBar =
    section.raw_max != null && section.raw_max > 0 && section.raw_score != null;
  const percent = hasRawBar
    ? Math.round(((section.raw_score ?? 0) / (section.raw_max ?? 1)) * 100)
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
    </Card>
  );
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
