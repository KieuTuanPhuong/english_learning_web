"use client";
// The live section: answer state, debounced autosave, expiry handling, submit.
//
// Local React state is authoritative while a section is running — the network
// write is a debounced side effect, never on the keystroke path, and a save
// does not invalidate the attempt query (refetching the draft we just wrote
// would fight the student's typing).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  useAdvanceSectionItem,
  useAutosaveSection,
  useSubmitSection,
  useUploadMockTestAudio,
} from "@/lib/hooks";
import type { AnswerState } from "@/lib/exercises";
import {
  buildDraft,
  buildPalette,
  countAnswered,
  hydrateAnswers,
  isSequential,
  openExercises,
  parseDraft,
  useDebouncedSave,
  useServerCountdown,
  type DraftEnvelope,
  type SaveStatus,
} from "@/lib/mock-tests";
import type { SectionAttempt } from "@/lib/types";
import { Badge, Button, Card } from "@/components/ui";
import { ExercisePane } from "./ExercisePane";
import { QuestionPalette } from "./QuestionPalette";
import { SaveIndicator } from "./SaveIndicator";
import { SectionTimer } from "./SectionTimer";
import { SubmitSectionDialog, TimeUpDialog } from "./SectionDialogs";

export function SectionRunner({
  attemptId,
  section,
  serverTime,
  sectionNumber,
  sectionCount,
  isLastSection,
}: {
  attemptId: number;
  section: SectionAttempt;
  serverTime: string;
  sectionNumber: number;
  sectionCount: number;
  isLastSection: boolean;
}) {
  const router = useRouter();
  // Every part of the section — the palette, the question numbering and the
  // answered count are all section-wide, even when only one part is on screen.
  const exercises = useMemo(() => section.exercises ?? [], [section.exercises]);
  // What the server currently allows the student to work on. In a `free`
  // section that is everything; in a `sequential` one (a Listening recording,
  // a Speaking part) it is exactly the part in hand.
  const visible = useMemo(() => openExercises(section), [section]);
  const gated = isSequential(section);
  const completedItems = useMemo(
    () => parseDraft(section.draft_answers).meta.completed_items,
    [section.draft_answers],
  );
  const currentPart = visible[0];
  const partNumber = completedItems.length + 1;
  const hasNextPart = gated && partNumber < exercises.length;

  // ---- Resume ---------------------------------------------------------------
  // Hydrated once, in the state initialisers, rather than in an effect: the
  // shell remounts this component per section (`key={section.id}`), so "mount"
  // and "new section" are the same event — and a later `draft_answers` refetch
  // can never overwrite what the student is currently typing.
  const initialDraft = useState(() => parseDraft(section.draft_answers))[0];

  const [answers, setAnswers] = useState<Record<number, Record<number, AnswerState>>>(
    () =>
      Object.fromEntries(
        Object.entries(initialDraft.answers).map(([exerciseId, payload]) => [
          Number(exerciseId),
          hydrateAnswers(payload),
        ]),
      ),
  );
  const [writing, setWriting] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      Object.entries(initialDraft.writing).map(([exerciseId, text]) => [
        Number(exerciseId),
        text,
      ]),
    ),
  );
  const [audioPlayed, setAudioPlayed] = useState<number[]>(
    () => initialDraft.meta.audio_played,
  );
  // Uploaded speaking answers, as `{exercise_id: url}`. Kept out of the draft
  // envelope on purpose — audio in every autosave would blow past the
  // write-volume budget — and attached at submit instead. These are URLs, not
  // base64: three Speaking parts of several minutes each would otherwise be
  // tens of megabytes of JSON in a single request.
  const [recordings, setRecordings] = useState<Record<number, string>>({});
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  // Keyed by exercise so a failed Part 2 upload does not show its error under
  // Part 3 as well.
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  // Set only from the 409 handler; clock expiry is derived below.
  const [serverExpired, setServerExpired] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const autosave = useAutosaveSection(attemptId);
  const submit = useSubmitSection(attemptId);
  const advance = useAdvanceSectionItem(attemptId);
  const upload = useUploadMockTestAudio(attemptId);
  const { remainingMs, phase } = useServerCountdown(section.expires_at, serverTime);
  const expired = serverExpired || phase === "expired";

  // ---- Autosave -------------------------------------------------------------
  const save = useCallback(
    (draft: DraftEnvelope) => {
      setSaveStatus("saving");
      autosave.mutate(
        { sectionAttemptId: section.id, draft },
        {
          onSuccess: () => setSaveStatus("saved"),
          onError: (error) => {
            // 409 `section_expired` is a state transition, not a failure worth
            // retrying: the server has stopped accepting writes.
            if (error instanceof ApiError && error.status === 409) {
              setServerExpired(true);
              setSaveStatus("idle");
              return;
            }
            setSaveStatus("error");
          },
        },
      );
    },
    [autosave, section.id],
  );

  const { schedule, flush, cancel } = useDebouncedSave(save, {
    delay: 3000,
    maxWait: 10_000,
  });

  // Latest state in a ref so flush() (submit, tab hide) sends the newest draft
  // rather than whatever was current when the save was scheduled.
  const stateRef = useRef({ answers, writing, audioPlayed });
  useEffect(() => {
    stateRef.current = { answers, writing, audioPlayed };
  });

  const queueSave = useCallback(
    (
      next?: Partial<{
        answers: Record<number, Record<number, AnswerState>>;
        writing: Record<number, string>;
        audioPlayed: number[];
      }>,
    ) => {
      if (expired) return;
      const merged = { ...stateRef.current, ...next };
      schedule(
        buildDraft(
          exercises,
          merged.answers,
          merged.writing,
          merged.audioPlayed,
          completedItems,
        ),
      );
    },
    [completedItems, exercises, expired, schedule],
  );

  // Best-effort save when the tab is hidden. sendBeacon is not an option: it
  // cannot carry the JWT Authorization header.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      flush();
      event.preventDefault();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [flush]);

  // ---- Expiry ---------------------------------------------------------------
  useEffect(() => {
    if (expired) cancel(); // a pending write would only 409
  }, [expired, cancel]);

  // ---- Edits ----------------------------------------------------------------
  const onAnswerChange = useCallback(
    (exerciseId: number, questionId: number, answer: AnswerState) => {
      setAnswers((current) => {
        const next = {
          ...current,
          [exerciseId]: { ...current[exerciseId], [questionId]: answer },
        };
        queueSave({ answers: next });
        return next;
      });
    },
    [queueSave],
  );

  const onWritingChange = useCallback(
    (exerciseId: number, text: string) => {
      setWriting((current) => {
        const next = { ...current, [exerciseId]: text };
        queueSave({ writing: next });
        return next;
      });
    },
    [queueSave],
  );

  const onAudioPlayed = useCallback(
    (exerciseId: number) => {
      setAudioPlayed((current) => {
        if (current.includes(exerciseId)) return current;
        const next = [...current, exerciseId];
        queueSave({ audioPlayed: next });
        return next;
      });
    },
    [queueSave],
  );

  // ---- Speaking uploads -----------------------------------------------------
  // Uploaded as soon as the clip exists rather than at submit: a five-minute
  // answer uploading while the student reads the next prompt is invisible;
  // three of them uploading at submit is not.
  const onRecorded = useCallback(
    (exerciseId: number, blob: Blob, mimeType: string) => {
      // Same reference back when there is nothing to clear: a new object here
      // is a re-render on every upload attempt, for no visible change.
      setUploadErrors((current) => {
        if (!(exerciseId in current)) return current;
        const rest = { ...current };
        delete rest[exerciseId];
        return rest;
      });
      setUploadingFor(exerciseId);
      upload.mutate(
        { audio: blob, mimeType, exerciseId },
        {
          onSuccess: ({ url }) => {
            setRecordings((current) => ({ ...current, [exerciseId]: url }));
            setUploadingFor(null);
          },
          onError: (error) => {
            setUploadingFor(null);
            setUploadErrors((current) => ({
              ...current,
              [exerciseId]:
                error instanceof ApiError
                  ? error.message
                  : "Couldn't upload that recording. Try recording it again.",
            }));
          },
        },
      );
    },
    [upload],
  );

  // ---- Next part (sequential sections) --------------------------------------
  const goToNextPart = useCallback(() => {
    if (!currentPart) return;
    setAdvanceError(null);
    flush(); // the part's answers must land before it is closed
    advance.mutate(
      { sectionAttemptId: section.id, exerciseId: currentPart.id },
      {
        onError: (error) =>
          setAdvanceError(
            error instanceof ApiError
              ? error.message
              : "Couldn't move to the next part.",
          ),
      },
    );
  }, [advance, currentPart, flush, section.id]);

  // ---- Submit ---------------------------------------------------------------
  const confirmSubmit = useCallback(async () => {
    setSubmitError(null);
    flush();
    try {
      await submit.mutateAsync({
        sectionAttemptId: section.id,
        body: {
          // Ignored server-side once expired — the last accepted draft wins.
          draft: buildDraft(
            exercises, answers, writing, audioPlayed, completedItems,
          ),
          recordings: Object.fromEntries(
            Object.entries(recordings).map(([id, url]) => [String(id), url]),
          ),
        },
      });
      setShowSubmit(false);
      if (isLastSection) {
        router.replace(`/mock-tests/attempts/${attemptId}/report`);
      }
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "Couldn't submit this section.",
      );
    }
  }, [
    answers, attemptId, audioPlayed, completedItems, exercises, flush,
    isLastSection, recordings, router, section.id, submit, writing,
  ]);

  // ---- Render ---------------------------------------------------------------
  const palette = useMemo(() => buildPalette(exercises, answers), [exercises, answers]);
  const progress = useMemo(() => countAnswered(exercises, answers), [exercises, answers]);

  // Question numbers run continuously across the section's exercises, so each
  // pane needs the count of everything before it.
  const numberOffsets = useMemo(
    () =>
      exercises.reduce<number[]>(
        (offsets, exercise) =>
          offsets.concat(
            offsets[offsets.length - 1] + (exercise.questions?.length ?? 0),
          ),
        [0],
      ),
    [exercises],
  );

  function jumpTo(questionId: number) {
    document
      .getElementById(`question-${questionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="truncate text-sm font-semibold">{section.title}</span>
            <Badge kind={section.skill}>{section.skill}</Badge>
            <span className="text-xs text-zinc-500">
              Section {sectionNumber} of {sectionCount}
            </span>
            {gated && exercises.length > 1 && (
              <span className="text-xs font-medium text-zinc-700">
                Part {partNumber} of {exercises.length}
              </span>
            )}
          </div>
          <SaveIndicator status={saveStatus} />
          <SectionTimer remainingMs={remainingMs} phase={phase} />
          {hasNextPart ? (
            <Button
              size="sm"
              onClick={goToNextPart}
              loading={advance.isPending}
              disabled={expired}
            >
              Next part <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setShowSubmit(true)} disabled={expired}>
              Submit section
            </Button>
          )}
        </div>

        {/* Section progress. `progress` counts every question in the section,
            not only the visible part, so a gated Listening section still shows
            how much of the whole thing is done. */}
        {progress.total > 0 && (
          <div className="mx-auto max-w-7xl px-4 pb-2">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.answered}
              aria-label={`${progress.answered} of ${progress.total} questions answered`}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{
                  width: `${Math.round((progress.answered / progress.total) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {progress.answered} of {progress.total} answered
            </p>
          </div>
        )}

        {palette.length > 0 && (
          <div className="mx-auto max-w-7xl border-t border-zinc-100 px-4 py-2">
            <QuestionPalette entries={palette} onJump={jumpTo} />
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-6">
        {gated && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            This section runs one part at a time. Once you move on you cannot
            come back — the same as the real exam.
          </p>
        )}
        {advanceError && <p className="text-sm text-red-600">{advanceError}</p>}

        {gated && visible.length === 0 && (
          <Card className="space-y-2 p-8 text-center">
            <p className="font-semibold">Every part is finished</p>
            <p className="text-sm text-zinc-600">
              Submit the section to lock in your answers and move on.
            </p>
            <Button onClick={() => setShowSubmit(true)} disabled={expired}>
              Submit section
            </Button>
          </Card>
        )}

        {visible.map((exercise) => {
          // Numbering is section-wide, so the offset comes from the exercise's
          // position in the whole section, not in the visible slice.
          const index = exercises.findIndex((item) => item.id === exercise.id);
          return (
            <ExercisePane
              key={exercise.id}
              exercise={exercise}
              skill={section.skill}
              numberOffset={numberOffsets[index] ?? 0}
              answers={answers[exercise.id] ?? {}}
              onAnswerChange={(questionId, answer) =>
                onAnswerChange(exercise.id, questionId, answer)
              }
              writingText={writing[exercise.id] ?? ""}
              onWritingChange={(text) => onWritingChange(exercise.id, text)}
              audioPlayed={audioPlayed.includes(exercise.id)}
              onAudioPlayed={() => onAudioPlayed(exercise.id)}
              onRecorded={(blob, mimeType) =>
                onRecorded(exercise.id, blob, mimeType)
              }
              uploading={uploadingFor === exercise.id}
              uploadError={uploadErrors[exercise.id] ?? null}
              disabled={expired}
            />
          );
        })}
      </main>

      <SubmitSectionDialog
        open={showSubmit && !expired}
        onClose={() => setShowSubmit(false)}
        onConfirm={confirmSubmit}
        submitting={submit.isPending}
        answered={progress.answered}
        total={progress.total}
        isLastSection={isLastSection}
        error={submitError}
      />
      <TimeUpDialog
        open={expired}
        onSubmit={confirmSubmit}
        submitting={submit.isPending}
        error={submitError}
      />
    </div>
  );
}
