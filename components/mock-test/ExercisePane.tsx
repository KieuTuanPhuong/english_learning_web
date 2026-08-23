"use client";
// One exercise inside a section: the stimulus (passage / play-once audio /
// prompt) beside the response area. Receptive exercises render the existing
// components/quiz/QuestionCard unchanged; productive ones get a textarea or the
// recorder.
//
// The payload here is the answer-blind runner serializer, so there is no
// `is_correct` to leak and fill-blank keys arrive already masked to `[[]]`.
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Timer } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import type { AnswerState } from "@/lib/exercises";
import { wordCount } from "@/lib/format";
import { useRecorder } from "@/lib/use-recorder";
import type { TestRunnerExercise } from "@/lib/types";
import { PlayOnceAudio } from "./PlayOnceAudio";

interface ExercisePaneProps {
  exercise: TestRunnerExercise;
  skill: string;
  /** Question numbers continue across exercises within a section. */
  numberOffset: number;
  answers: Record<number, AnswerState>;
  onAnswerChange: (questionId: number, answer: AnswerState) => void;
  writingText: string;
  onWritingChange: (text: string) => void;
  audioPlayed: boolean;
  onAudioPlayed: () => void;
  /** Raw capture. The parent uploads it and keeps the returned URL — a base64
   *  clip in the submit body does not survive a real Speaking section. */
  onRecorded: (blob: Blob, mimeType: string) => void;
  uploading?: boolean;
  uploadError?: string | null;
  disabled?: boolean;
}

export function ExercisePane({
  exercise,
  skill,
  numberOffset,
  answers,
  onAnswerChange,
  writingText,
  onWritingChange,
  audioPlayed,
  onAudioPlayed,
  onRecorded,
  uploading,
  uploadError,
  disabled,
}: ExercisePaneProps) {
  const questions = exercise.questions ?? [];
  const isWriting = skill === "writing";
  const isSpeaking = skill === "speaking";

  return (
    <section
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2"
      aria-label={exercise.title}
    >
      {/* Stimulus */}
      <div className="space-y-4">
        <Card className="bg-zinc-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {exercise.title}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
            {exercise.prompt_text}
          </p>
        </Card>

        {skill === "listening" && exercise.audio_prompt_url && (
          <PlayOnceAudio
            src={exercise.audio_prompt_url}
            alreadyPlayed={audioPlayed}
            onStarted={onAudioPlayed}
            onEnded={onAudioPlayed}
          />
        )}

        {exercise.content_text && (
          <Card className="max-h-[60vh] overflow-y-auto bg-zinc-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Passage
            </p>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {exercise.content_text}
            </div>
          </Card>
        )}
      </div>

      {/* Response */}
      <div className="space-y-4">
        {isWriting ? (
          <WritingTaskPane
            value={writingText}
            onChange={onWritingChange}
            disabled={disabled}
          />
        ) : isSpeaking ? (
          <SpeakingTaskPane
            prepSeconds={exercise.prep_seconds ?? null}
            maxRecordSeconds={exercise.max_record_seconds ?? null}
            uploading={Boolean(uploading)}
            uploadError={uploadError ?? null}
            onRecorded={onRecorded}
            disabled={disabled}
          />
        ) : questions.length > 0 ? (
          questions.map((question, index) => (
            <div key={question.id} id={`question-${question.id}`}>
              <QuestionCard
                number={numberOffset + index + 1}
                question={question}
                answer={answers[question.id]}
                onChange={(answer) => onAnswerChange(question.id, answer)}
                disabled={disabled}
              />
            </div>
          ))
        ) : (
          <p className="text-sm italic text-zinc-500">
            No questions on this exercise.
          </p>
        )}
      </div>
    </section>
  );
}

function WritingTaskPane({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="writing-response"
        className="block text-sm font-medium text-zinc-700"
      >
        Your response
      </label>
      <textarea
        id="writing-response"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder="Start typing…"
        className="min-h-[420px] w-full resize-y rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:bg-zinc-50"
      />
      <p className="text-xs text-zinc-400">{wordCount(value)} words</p>
    </div>
  );
}

function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * One Speaking part: an optional preparation countdown, then a capped
 * recording, then upload.
 *
 * IELTS Part 2 gives exactly one minute to prepare and one to two minutes to
 * talk; Parts 1 and 3 are unprepared and longer. Both numbers come from the
 * part's `TestSectionExercise` row, so a differently-timed exam needs data, not
 * a code change. The recorder's own hard stop enforces the cap here and the
 * upload endpoint enforces it again — the cap is part of the test, not a UI
 * nicety.
 */
function SpeakingTaskPane({
  prepSeconds,
  maxRecordSeconds,
  uploading,
  uploadError,
  onRecorded,
  disabled,
}: {
  prepSeconds: number | null;
  maxRecordSeconds: number | null;
  uploading: boolean;
  uploadError: string | null;
  onRecorded: (blob: Blob, mimeType: string) => void;
  disabled?: boolean;
}) {
  const maxDurationMs = (maxRecordSeconds ?? 300) * 1000;
  const { state, recording, elapsedMs, start, stop, reset } = useRecorder({
    maxDurationMs,
  });
  // Preparation does not begin until the student asks for it, so nobody loses
  // the minute to a page they have not read yet.
  const [preparing, setPreparing] = useState(false);
  const [prepRemainingMs, setPrepRemainingMs] = useState(0);
  // The deadline, not the remainder, is the source of truth: a backgrounded tab
  // throttles timers, and counting down by one each tick would hand back time
  // the student did not have.
  const prepDeadlineRef = useRef(0);
  const hasPrep = (prepSeconds ?? 0) > 0;

  const beginPrep = useCallback(() => {
    const durationMs = (prepSeconds ?? 0) * 1000;
    prepDeadlineRef.current = Date.now() + durationMs;
    setPrepRemainingMs(durationMs);
    setPreparing(true);
  }, [prepSeconds]);

  useEffect(() => {
    if (!preparing) return;
    const interval = window.setInterval(() => {
      const remaining = prepDeadlineRef.current - Date.now();
      if (remaining <= 0) {
        setPreparing(false);
        setPrepRemainingMs(0);
        void start(); // preparation ending starts the turn, as in the real test
        return;
      }
      setPrepRemainingMs(remaining);
    }, 250);
    return () => window.clearInterval(interval);
  }, [preparing, start]);

  // The parent passes a fresh closure every render, so it lives in a ref: with
  // `onRecorded` as a dependency the upload it triggers re-renders the parent,
  // which re-runs this effect, which uploads again — an update loop.
  const recordedRef = useRef(onRecorded);
  useEffect(() => {
    recordedRef.current = onRecorded;
  });

  // A clip uploads exactly once. `recording` only changes identity on stop and
  // on reset, but StrictMode replays mount effects and an upload is not free.
  const uploadedBlobRef = useRef<Blob | null>(null);
  useEffect(() => {
    if (!recording || uploadedBlobRef.current === recording.blob) return;
    uploadedBlobRef.current = recording.blob;
    recordedRef.current(recording.blob, recording.mimeType);
  }, [recording]);

  if (state === "unsupported") {
    return (
      <p className="text-sm text-red-600">
        This browser does not support audio recording.
      </p>
    );
  }

  const remainingMs = Math.max(0, maxDurationMs - elapsedMs);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-zinc-700">Your recording</p>
        {maxRecordSeconds != null && (
          <p className="text-xs text-zinc-500">
            Stops automatically at {formatSeconds(maxRecordSeconds)}
          </p>
        )}
      </div>

      {preparing ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-8">
          <Timer className="h-5 w-5 text-amber-600" aria-hidden />
          <p className="text-sm font-medium text-amber-900">
            Preparation time — make notes now
          </p>
          <p className="font-mono text-3xl font-bold text-amber-900" role="timer">
            {formatSeconds(prepRemainingMs / 1000)}
          </p>
          <p className="text-xs text-amber-800">
            Recording starts automatically when this reaches zero.
          </p>
        </div>
      ) : recording ? (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <audio src={recording.url} controls className="w-full" />
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            disabled={disabled || uploading}
          >
            Discard and re-record
          </Button>
          {uploading && (
            <p className="text-xs text-zinc-500">Uploading your answer…</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-8">
          <Button
            type="button"
            variant={state === "recording" ? "danger" : "outline"}
            onClick={
              state === "recording" ? stop : hasPrep ? beginPrep : start
            }
            loading={state === "requesting"}
            disabled={disabled}
          >
            {state === "recording" ? (
              <>
                <Square className="h-4 w-4" aria-hidden /> Stop recording
              </>
            ) : hasPrep ? (
              <>
                <Timer className="h-4 w-4" aria-hidden /> Start preparation (
                {formatSeconds(prepSeconds ?? 0)})
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" aria-hidden /> Start recording
              </>
            )}
          </Button>
          {state === "recording" && (
            <p className="animate-pulse text-sm text-red-500">
              Recording… {formatSeconds(remainingMs / 1000)} left
            </p>
          )}
          {state === "denied" && (
            <p className="text-sm text-red-600">
              Microphone access was denied. Enable it in your browser settings.
            </p>
          )}
        </div>
      )}
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
    </div>
  );
}
