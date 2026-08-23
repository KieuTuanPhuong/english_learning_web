"use client";
// Mock-test client helpers: the autosave draft envelope, the server-synced
// countdown, and a debounced saver. Sibling of lib/exercises.ts.
//
// Deliberately no localStorage draft (unlike the practice exercise page): the
// server draft is the single source of truth for resume, and a second local
// copy would need conflict resolution — and could resurrect answers into an
// already-expired section.
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { AnswerState } from "./exercises";
import { buildAnswers, isComplete, resolveQuestionType } from "./exercises";
import type { SectionAttempt, TestRunnerExercise, TestRunnerQuestion } from "./types";

// ---- Draft envelope --------------------------------------------------------
// Mirrors SectionAttempt.draft_answers on the backend. Keys are exercise ids as
// strings (JSON object keys are always strings).
export const draftEnvelopeSchema = z.object({
  answers: z.record(z.string(), z.unknown()).default({}),
  writing: z.record(z.string(), z.string()).default({}),
  meta: z
    .object({
      audio_played: z.array(z.number()).default([]),
      // Parts finished in a `sequential` section, in the order they were
      // finished. The server owns this cursor — it only moves through the
      // advance endpoint — so the client reads it and never invents it.
      completed_items: z.array(z.number()).default([]),
    })
    .default({ audio_played: [], completed_items: [] }),
});
export type DraftEnvelope = z.infer<typeof draftEnvelopeSchema>;

export const EMPTY_DRAFT: DraftEnvelope = {
  answers: {},
  writing: {},
  meta: { audio_played: [], completed_items: [] },
};

/** Parse a server draft, falling back to an empty envelope rather than
 *  crashing the runner on unexpected JSON. */
export function parseDraft(raw: unknown): DraftEnvelope {
  const parsed = draftEnvelopeSchema.safeParse(raw);
  return parsed.success ? parsed.data : EMPTY_DRAFT;
}

// ---- Server-synced countdown ----------------------------------------------
export type TimerPhase = "normal" | "warning" | "critical" | "expired";

const WARNING_MS = 5 * 60 * 1000;
const CRITICAL_MS = 60 * 1000;

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function phaseFor(remainingMs: number): TimerPhase {
  if (remainingMs <= 0) return "expired";
  if (remainingMs <= CRITICAL_MS) return "critical";
  if (remainingMs <= WARNING_MS) return "warning";
  return "normal";
}

/**
 * Countdown to a server-issued `expires_at`, corrected for client clock skew.
 *
 * The whole point is the offset: `serverTime` arrives in the same response as
 * `expiresAt`, so it cancels out however wrong the device clock is. Libraries
 * like react-countdown count down from `Date.now()` and have no notion of a
 * server clock — which is exactly the part that must not be trusted here.
 */
export function useServerCountdown(
  expiresAt: string | null | undefined,
  serverTime: string | null | undefined,
): { remainingMs: number | null; phase: TimerPhase } {
  // null until the first tick lands (sub-frame), so the clock is never read
  // during render — see the effect below.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const deadline = Date.parse(expiresAt);
    if (Number.isNaN(deadline)) return;

    // Offset is captured once per (expiresAt, serverTime) pair — both arrive in
    // the same response, so however wrong the device clock is, it cancels out.
    const serverNow = serverTime ? Date.parse(serverTime) : Number.NaN;
    const offset = Number.isNaN(serverNow) ? 0 : serverNow - Date.now();

    const tick = () => setRemainingMs(deadline - (Date.now() + offset));
    const immediate = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 500);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(interval);
    };
  }, [expiresAt, serverTime]);

  const phase: TimerPhase =
    !expiresAt || remainingMs === null ? "normal" : phaseFor(remainingMs);
  return { remainingMs, phase };
}

// ---- Debounced autosave ----------------------------------------------------
export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounce a save, with a hard `maxWait` ceiling so continuous typing still
 * checkpoints, plus `flush` (submit / tab-hide) and `cancel` (section expired,
 * where another write would only 409).
 *
 * Hand-rolled rather than adding `use-debounce`: the repo carries no debounce
 * dependency today and these three behaviours are the entire surface we need.
 * The callback lives in a ref so a flush never fires a stale closure.
 */
export function useDebouncedSave<T>(
  save: (value: T) => void,
  { delay = 3000, maxWait = 10000 }: { delay?: number; maxWait?: number } = {},
) {
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  const timerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const pendingRef = useRef<{ value: T } | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (maxTimerRef.current !== null) window.clearTimeout(maxTimerRef.current);
    timerRef.current = null;
    maxTimerRef.current = null;
  }, []);

  const run = useCallback(() => {
    clearTimers();
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) saveRef.current(pending.value);
  }, [clearTimers]);

  const schedule = useCallback(
    (value: T) => {
      pendingRef.current = { value };
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(run, delay);
      if (maxTimerRef.current === null) {
        maxTimerRef.current = window.setTimeout(run, maxWait);
      }
    },
    [delay, maxWait, run],
  );

  const flush = useCallback(() => {
    if (pendingRef.current) run();
  }, [run]);

  const cancel = useCallback(() => {
    pendingRef.current = null;
    clearTimers();
  }, [clearTimers]);

  // Flush on unmount so navigating away mid-section does not drop the last edit.
  useEffect(() => () => flush(), [flush]);

  return { schedule, flush, cancel };
}

// ---- Question palette ------------------------------------------------------
export type PaletteState = "current" | "answered" | "unanswered";

export interface PaletteEntry {
  /** 1-based number shown in the grid, continuous across the whole section. */
  number: number;
  exerciseId: number;
  questionId: number;
  state: PaletteState;
}

/** One question's completeness, reusing the practice quiz's own rules. */
export function isAnswered(
  question: TestRunnerQuestion,
  answer: AnswerState | undefined,
): boolean {
  if (!answer) return false;
  return isComplete([question], { [question.id]: answer });
}

/** Flatten a section's exercises into one numbered list, IELTS-style: question
 *  numbering runs across passages, not per passage. */
export function buildPalette(
  exercises: TestRunnerExercise[],
  answers: Record<number, Record<number, AnswerState>>,
  currentQuestionId?: number,
): PaletteEntry[] {
  const entries: PaletteEntry[] = [];
  let number = 1;
  for (const exercise of exercises) {
    for (const question of exercise.questions ?? []) {
      const answer = answers[exercise.id]?.[question.id];
      entries.push({
        number: number++,
        exerciseId: exercise.id,
        questionId: question.id,
        state:
          question.id === currentQuestionId
            ? "current"
            : isAnswered(question, answer)
              ? "answered"
              : "unanswered",
      });
    }
  }
  return entries;
}

export function countAnswered(
  exercises: TestRunnerExercise[],
  answers: Record<number, Record<number, AnswerState>>,
): { answered: number; total: number } {
  const palette = buildPalette(exercises, answers);
  return {
    answered: palette.filter((entry) => entry.state === "answered").length,
    total: palette.length,
  };
}

// ---- Draft <-> runner state ------------------------------------------------
/**
 * Rebuild per-question answer state from a saved `AnswersPayload`, so a resumed
 * section renders exactly what was last saved. Inverse of `buildAnswers`.
 */
export function hydrateAnswers(payload: unknown): Record<number, AnswerState> {
  const state: Record<number, AnswerState> = {};
  if (!payload || typeof payload !== "object") return state;
  const responses = (payload as { responses?: unknown }).responses;
  if (!Array.isArray(responses)) return state;

  for (const response of responses) {
    if (!response || typeof response !== "object") continue;
    const { question_id: questionId, option_id: optionId, text } =
      response as { question_id?: number; option_id?: number; text?: string };
    if (typeof questionId !== "number") continue;
    if (optionId === undefined && text === undefined) continue;
    state[questionId] = { option_id: optionId, text };
  }
  return state;
}

/**
 * Fold runner state into the wire envelope. Answers go through `buildAnswers`
 * so mock-test submissions are graded by exactly the same code path — and in
 * exactly the same shape — as ordinary practice quizzes.
 */
export function buildDraft(
  exercises: TestRunnerExercise[],
  answers: Record<number, Record<number, AnswerState>>,
  writing: Record<number, string>,
  audioPlayed: number[],
  completedItems: number[] = [],
): DraftEnvelope {
  const draft: DraftEnvelope = {
    answers: {},
    writing: {},
    meta: { audio_played: [...audioPlayed], completed_items: [...completedItems] },
  };
  for (const exercise of exercises) {
    const questions = exercise.questions ?? [];
    if (questions.length > 0) {
      draft.answers[String(exercise.id)] = buildAnswers(
        questions,
        answers[exercise.id] ?? {},
      );
    }
    const text = writing[exercise.id];
    if (text !== undefined) draft.writing[String(exercise.id)] = text;
  }
  return draft;
}

// ---- Misc ------------------------------------------------------------------
export const RECEPTIVE_SKILLS = ["listening", "reading"] as const;
export const PRODUCTIVE_SKILLS = ["writing", "speaking"] as const;

export function isReceptive(skill: string): boolean {
  return (RECEPTIVE_SKILLS as readonly string[]).includes(skill);
}

/** The section the runner should show: the one in progress, else the first not
 *  yet started. `undefined` means every section is done. */
export function activeSection(
  sections: readonly SectionAttempt[],
): SectionAttempt | undefined {
  return (
    sections.find((section) => section.status === "in_progress") ??
    sections.find((section) => section.status === "not_started")
  );
}

/**
 * The parts of a section the student may work on right now.
 *
 * The server decides this and says so in `open_exercise_ids`; this is a filter
 * over the exercises it already sent, not a second implementation of the rule.
 * A `free` section (Reading's three passages, Writing's two tasks) returns
 * everything; a `sequential` one (a Listening recording, a Speaking part)
 * returns exactly the part in hand.
 *
 * The fallback to "everything" matters: if a server ever omits the field, the
 * student sees their whole section rather than a blank screen.
 */
export function openExercises(
  section: SectionAttempt,
): TestRunnerExercise[] {
  const exercises = section.exercises ?? [];
  const open = section.open_exercise_ids;
  if (!Array.isArray(open)) return [...exercises];
  return exercises.filter((exercise) => open.includes(exercise.id));
}

/** True when this section hands out one part at a time. */
export function isSequential(section: SectionAttempt): boolean {
  return section.item_flow === "sequential";
}

/** Zero-based index of the part in hand, for "Part 2 of 4". */
export function currentItemIndex(section: SectionAttempt): number {
  const done = parseDraft(section.draft_answers).meta.completed_items.length;
  return Math.min(done, Math.max((section.exercises ?? []).length - 1, 0));
}

/** Sections finished / total, for the attempt-level progress bar. */
export function sectionProgress(
  sections: readonly SectionAttempt[],
): { completed: number; total: number; percent: number } {
  const total = sections.length;
  const completed = sections.filter((s) => s.status === "completed").length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

/** Re-exported so runner components need one import for question rendering. */
export { resolveQuestionType };
