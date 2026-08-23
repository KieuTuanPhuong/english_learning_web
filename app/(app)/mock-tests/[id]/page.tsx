"use client";
// Template detail: what the test contains, how long each section runs, and the
// rules — then "Start test", which creates the attempt and enters the runner.
// Creating an attempt does NOT start any clock; the per-section timer starts
// only when the student presses Start on a section intro.
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { ApiError, startSection as startSectionRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCreateTestAttempt, useMockTestTemplate } from "@/lib/hooks";
import { Badge, Button, Card, ErrorState, Skeleton } from "@/components/ui";

export default function MockTestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { role } = useAuth();
  const template = useMockTestTemplate(id);
  const createAttempt = useCreateTestAttempt();
  const [error, setError] = useState<string | null>(null);
  // Which "Start here" is spinning. Null while the whole-test button runs, so
  // the two never both show a spinner.
  const [pendingSection, setPendingSection] = useState<number | null>(null);
  const isStudent = role === "student";
  const busy = createAttempt.isPending;

  if (template.isLoading) return <Skeleton className="h-64 w-full" />;
  if (template.isError || !template.data) {
    return <ErrorState message="Couldn't load this mock test." />;
  }

  const data = template.data;
  const sections = data.sections ?? [];

  /**
   * Start the test. With no `sectionId` this is the real sitting: exam mode,
   * sections in order. With one, the student has picked where to begin, so the
   * attempt is created in practice mode and that section's clock is started
   * before we navigate — otherwise the runner would land them on section 1
   * anyway and the choice would have meant nothing.
   *
   * If an unfinished attempt already exists the server returns it untouched,
   * mode included. Starting the chosen section can then legitimately fail
   * ("Sections must be taken in order") because that older attempt is an exam
   * sitting — so we surface the message and still send them to the runner to
   * resume where they actually are.
   */
  async function start(sectionId?: number) {
    setError(null);
    setPendingSection(sectionId ?? null);
    try {
      const attempt = await createAttempt.mutateAsync({
        templateId: id,
        mode: sectionId == null ? "exam" : "practice",
      });
      if (sectionId != null) {
        const target = (attempt.sections ?? []).find(
          (section) => section.section_id === sectionId,
        );
        if (target && target.status === "not_started") {
          try {
            // The raw call, not useStartSection: that hook binds the attempt id
            // when it is created, and the attempt does not exist until the line
            // above returns.
            await startSectionRequest(attempt.id, target.id);
          } catch (err) {
            setError(
              err instanceof ApiError
                ? `${err.message} Resuming your attempt in progress.`
                : "Couldn't start that section.",
            );
          }
        }
      }
      router.push(`/mock-tests/attempts/${attempt.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start this test.");
    } finally {
      setPendingSection(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/mock-tests"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ChevronLeft size={16} aria-hidden /> Back to mock tests
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{data.format_name}</Badge>
          {data.difficulty_level && <Badge kind={data.difficulty_level} />}
        </div>
        <h1 className="text-3xl font-bold">{data.title}</h1>
        {data.description && <p className="text-zinc-600">{data.description}</p>}
        <p className="inline-flex items-center gap-1 text-sm text-zinc-500">
          <Clock size={14} aria-hidden />
          {data.total_duration_minutes} minutes total across {sections.length} sections
        </p>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-700">Sections</h2>
          {isStudent && sections.length > 1 && (
            <p className="text-xs text-zinc-500">
              Start anywhere — pick the skill you came to practise
            </p>
          )}
        </div>
        <ol className="divide-y divide-zinc-100">
          {sections.map((section, index) => (
            <li key={section.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
                {index + 1}
              </span>
              <div className="min-w-40 flex-1">
                <p className="font-medium">{section.title}</p>
                <p className="text-xs text-zinc-500">
                  {(section.items ?? []).length} part
                  {(section.items ?? []).length === 1 ? "" : "s"}
                </p>
              </div>
              <Badge kind={section.skill}>{section.skill}</Badge>
              <span className="w-16 text-right text-sm text-zinc-600">
                {section.duration_minutes} min
              </span>
              {isStudent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => start(section.id)}
                  loading={pendingSection === section.id}
                  disabled={busy && pendingSection !== section.id}
                >
                  Start here
                </Button>
              )}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="space-y-2 border-amber-200 bg-amber-50 text-sm text-amber-900">
        <p className="font-semibold">Exam rules</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Start test</strong> sits the sections in order, like the real
            exam. <strong>Start here</strong> on a section lets you take them in
            any order — useful for practice, but not how the real test runs.
          </li>
          <li>Either way, one section runs at a time and is timed on the server.</li>
          <li>You cannot return to a section after submitting it.</li>
          <li>Listening audio plays once — there is no replay.</li>
          <li>Answers autosave; a disconnection loses at most a few seconds of work.</li>
          <li>
            An overall band still needs every section scored, whichever order you
            take them in.
          </li>
          <li>Scores are estimates based on approximate conversion tables.</li>
        </ul>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isStudent ? (
        <Button
          onClick={() => start()}
          loading={busy && pendingSection === null}
          disabled={sections.length === 0 || (busy && pendingSection !== null)}
          className="w-full"
        >
          Start test — full paper, in order
        </Button>
      ) : (
        <p className="text-sm text-zinc-500">
          Only students can sit a mock test. You can review any of your
          students&rsquo; attempts from their score report.
        </p>
      )}
    </div>
  );
}
