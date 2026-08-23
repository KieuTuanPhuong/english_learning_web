"use client";
// Picks which screen the attempt is on: a section intro, the live section, or
// the finished state. Everything derives from the server's section statuses —
// there is no client-side notion of "where I am" that could drift out of sync.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useStartSection } from "@/lib/hooks";
import { activeSection } from "@/lib/mock-tests";
import type { SectionAttempt, TestAttempt } from "@/lib/types";
import { Badge, Button, Card } from "@/components/ui";
import { SectionIntro } from "./SectionIntro";
import { SectionRunner } from "./SectionRunner";

export function TestRunnerShell({ attempt }: { attempt: TestAttempt }) {
  const sections = attempt.sections ?? [];
  const startSection = useStartSection(attempt.id);
  const [startError, setStartError] = useState<string | null>(null);
  const [chosenId, setChosenId] = useState<number | null>(null);

  const running = sections.find((section) => section.status === "in_progress");
  const remaining = sections.filter((section) => section.status !== "completed");
  const freeOrder = attempt.mode === "practice";

  const begin = (sectionAttemptId: number) => {
    setStartError(null);
    startSection.mutate(sectionAttemptId, {
      onError: (error) =>
        setStartError(
          error instanceof ApiError
            ? error.message
            : "Couldn't start this section.",
        ),
    });
  };

  if (remaining.length === 0) return <AttemptFinished attemptId={attempt.id} />;

  // In free order there is no "next" section to assume, so the student picks —
  // otherwise landing them on section 1 would quietly undo the choice they made
  // on the test page. Until they pick, the picker itself is the screen.
  const chosen = chosenId
    ? sections.find((section) => section.id === chosenId)
    : undefined;
  const current = running ?? (freeOrder ? chosen : activeSection(sections));

  if (!current) {
    return (
      <SectionPicker sections={sections} onPick={setChosenId} error={startError} />
    );
  }

  const index = sections.findIndex((section) => section.id === current.id);

  if (current.status === "not_started") {
    return (
      <SectionIntro
        section={current}
        index={index}
        total={sections.length}
        starting={startSection.isPending}
        error={startError}
        onBack={freeOrder ? () => setChosenId(null) : undefined}
        onStart={() => begin(current.id)}
      />
    );
  }

  return (
    <SectionRunner
      // Remount on section change so answer state can never leak across
      // sections, even if the runner is refactored later.
      key={current.id}
      attemptId={attempt.id}
      section={current}
      serverTime={attempt.server_time}
      sectionNumber={index + 1}
      sectionCount={sections.length}
      // "Last" means nothing else is left to sit, not "last in the list": in
      // free order the final section taken is rarely the bottom one, and the
      // student still needs sending to the report when they finish.
      isLastSection={remaining.length === 1}
    />
  );
}

/** Free-order hub: every section, its state, and a way in. */
function SectionPicker({
  sections,
  onPick,
  error,
}: {
  sections: readonly SectionAttempt[];
  onPick: (sectionAttemptId: number) => void;
  error: string | null;
}) {
  const done = sections.filter((s) => s.status === "completed").length;

  return (
    <div className="mx-auto max-w-2xl py-10">
      <Card className="space-y-5 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Choose a section</h1>
          <p className="text-sm text-zinc-600">
            You are taking this test in any order. {done} of {sections.length}{" "}
            sections finished — pick the next one when you are ready.
          </p>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={sections.length}
          aria-valuenow={done}
          aria-label={`${done} of ${sections.length} sections complete`}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${(done / sections.length) * 100}%` }}
          />
        </div>

        <ul className="divide-y divide-zinc-100">
          {sections.map((section) => {
            const completed = section.status === "completed";
            return (
              <li key={section.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-40 flex-1">
                  <p className="font-medium">{section.title}</p>
                  <p className="text-xs text-zinc-500">
                    {section.duration_minutes} min
                  </p>
                </div>
                <Badge kind={section.skill}>{section.skill}</Badge>
                {completed ? (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                    <CheckCircle2 size={16} aria-hidden /> Submitted
                  </span>
                ) : (
                  <Button size="sm" onClick={() => onPick(section.id)}>
                    Start
                  </Button>
                )}
              </li>
            );
          })}
        </ul>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </Card>
    </div>
  );
}

function AttemptFinished({ attemptId }: { attemptId: number }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-md py-20">
      <Card className="space-y-4 p-8 text-center">
        <CheckCircle2 size={40} className="mx-auto text-emerald-500" aria-hidden />
        <h1 className="text-xl font-bold">Test complete</h1>
        <p className="text-sm text-zinc-600">
          Every section is submitted. Listening and Reading scores are ready now;
          Writing and Speaking appear once they have been graded.
        </p>
        <Button
          className="w-full"
          onClick={() => router.replace(`/mock-tests/attempts/${attemptId}/report`)}
        >
          View score report
        </Button>
      </Card>
    </div>
  );
}
