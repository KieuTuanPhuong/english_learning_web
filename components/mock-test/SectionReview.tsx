"use client";
// Post-test answer review inside the score report. Listening/Reading tasks
// list every question with the key, the student's answer and — once the AI
// has marked the section — why each wrong answer is wrong. Writing/Speaking
// tasks show the response and the newest feedback (AI or teacher).
//
// Everything here comes from the report payload, which the server only fills
// for a completed section, so showing the answer key is safe.
import { Check, Lightbulb, X } from "lucide-react";
import { AiTag, Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatScore, timeAgo, wordCount } from "@/lib/format";
import type { QuestionReview, SubmissionReview } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  comprehension: "Comprehension",
  inference: "Inference",
  detail: "Detail",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  spelling: "Spelling",
  other: "Mistake",
};

export function SubmissionReviewList({
  submissions,
  receptive,
}: {
  submissions: SubmissionReview[];
  receptive: boolean;
}) {
  if (submissions.length === 0) return null;
  return (
    <div className="space-y-4">
      {submissions.map((task) =>
        receptive ? (
          <ReceptiveTaskReview
            key={task.submission_id}
            task={task}
            showTitle={submissions.length > 1}
          />
        ) : (
          <ProductiveTaskReview key={task.submission_id} task={task} />
        ),
      )}
    </div>
  );
}

function ReceptiveTaskReview({
  task,
  showTitle,
}: {
  task: SubmissionReview;
  showTitle: boolean;
}) {
  const wrong = task.questions.filter((q) => q.is_correct === false).length;
  const explanation = task.explanation;
  return (
    <div className="space-y-2">
      {showTitle && (
        <p className="text-sm font-semibold text-zinc-700">{task.exercise_title}</p>
      )}
      {explanation && (
        <div className="rounded-md border border-violet-200 bg-violet-50/40 p-3 text-sm text-zinc-800">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
            <AiTag /> Summary
          </p>
          <p className="mt-1">{explanation.summary}</p>
          {explanation.practice_suggestions.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-zinc-700">
              {explanation.practice_suggestions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {task.ai_status === "pending" && wrong > 0 && (
        <p className="text-xs text-zinc-500">
          Explanations for the {wrong} wrong answer{wrong === 1 ? "" : "s"} appear
          once the AI has marked this section.
        </p>
      )}
      <ol className="space-y-2">
        {task.questions.map((question) => (
          <QuestionRow key={question.question_id} question={question} />
        ))}
      </ol>
    </div>
  );
}

function QuestionRow({ question }: { question: QuestionReview }) {
  const state =
    question.is_correct === true
      ? "right"
      : question.is_correct === false
        ? "wrong"
        : "open";
  const category = question.category ? CATEGORY_LABEL[question.category] : undefined;
  return (
    <li
      className={cn(
        "rounded-md border p-3 text-sm",
        state === "wrong" && "border-red-200 bg-red-50/30",
        state === "right" && "border-emerald-200 bg-emerald-50/30",
        state === "open" && "border-zinc-200 bg-white",
      )}
    >
      <div className="flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
          {question.number}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="whitespace-pre-wrap font-medium text-zinc-800">{question.question}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-700">
            <span className="inline-flex items-center gap-1">
              <span className="text-zinc-500">Your answer:</span>
              {question.student_answer ? (
                <span
                  className={cn(
                    state === "wrong"
                      ? "text-red-700 line-through decoration-red-400"
                      : "font-medium",
                  )}
                >
                  {question.student_answer}
                </span>
              ) : (
                <span className="italic text-zinc-400">No answer</span>
              )}
              {state === "right" && (
                <Check size={14} className="text-emerald-600" aria-label="Correct" />
              )}
              {state === "wrong" && (
                <X size={14} className="text-red-600" aria-label="Incorrect" />
              )}
            </span>
            {state === "wrong" && question.correct.length > 0 && (
              <span>
                <span className="text-zinc-500">Correct:</span>{" "}
                <span className="font-semibold text-emerald-700">
                  {question.correct.join(" / ")}
                </span>
              </span>
            )}
          </div>
          {question.explanation && (
            <div className="rounded-md border border-violet-100 bg-white p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                <AiTag /> Why this is wrong{category ? ` · ${category}` : ""}
              </p>
              <p className="mt-1 text-zinc-700">{question.explanation}</p>
              {question.tip && (
                <p className="mt-1.5 flex items-start gap-1 text-xs text-zinc-500">
                  <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
                  {question.tip}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function ProductiveTaskReview({ task }: { task: SubmissionReview }) {
  const feedback = task.feedback;
  return (
    <div className="space-y-2 rounded-md border border-zinc-200 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-zinc-800">{task.exercise_title}</p>
        <Badge kind={task.exercise_type}>{task.exercise_type}</Badge>
      </div>
      {task.writing_text ? (
        <details>
          <summary className="cursor-pointer select-none text-xs text-zinc-500">
            Your response · {wordCount(task.writing_text)} words
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-zinc-700">{task.writing_text}</p>
        </details>
      ) : task.audio_recording_url ? (
        <audio controls src={task.audio_recording_url} className="w-full" />
      ) : (
        <p className="italic text-zinc-400">No response submitted.</p>
      )}
      {feedback ? (
        <div
          className={cn(
            "space-y-1 rounded-md border p-3",
            feedback.is_ai_generated
              ? "border-violet-200 bg-violet-50/40"
              : "border-zinc-200 bg-zinc-50",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
              {feedback.is_ai_generated ? (
                <>
                  <AiTag /> AI feedback
                </>
              ) : (
                "Teacher feedback"
              )}
            </span>
            <Badge kind="graded">{formatScore(feedback.score)}/100</Badge>
          </div>
          {feedback.comments && (
            <p className="whitespace-pre-wrap text-zinc-700">{feedback.comments}</p>
          )}
          <p className="text-xs text-zinc-400">{timeAgo(feedback.created_at)}</p>
        </div>
      ) : (
        <p className="text-xs text-amber-700">Awaiting marking.</p>
      )}
    </div>
  );
}
