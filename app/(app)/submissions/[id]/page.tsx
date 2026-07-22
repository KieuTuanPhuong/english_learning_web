"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth-context";
import {
  useExercise,
  useMySubmissions,
  useSubmissionFeedback,
  useSubmissionsInbox,
  useCreateFeedback,
  useAiEvaluate,
} from "@/lib/hooks";
import {
  Avatar,
  Badge,
  Card,
  ErrorState,
  Skeleton,
  AiTag,
  Button,
  TextArea,
  TextField,
} from "@/components/ui";
import { AnswersReview } from "@/components/quiz/AnswersReview";
import { dateLabel, formatScore, timeAgo, submissionStatusLabel } from "@/lib/format";
import { ApiError } from "@/lib/api";

export default function SubmissionDetailPage() {
  const { role } = useAuth();
  if (role === "student") return <StudentSubmissionDetail />;
  if (role === "teacher" || role === "admin") return <TeacherGradingScreen />;
  return <ErrorState message="Not authorized." />;
}

function StudentSubmissionDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const submissions = useMySubmissions();
  const submission = submissions.data?.find((s) => s.id === id);
  const exercise = useExercise(submission?.exercise_id ?? NaN);
  const feedback = useSubmissionFeedback(id);

  if (submissions.isLoading) return <Skeleton className="h-64 w-full" />;
  if (submissions.isError) return <ErrorState message="Couldn’t load submission." />;
  if (!submission) return <ErrorState message="Submission not found." />;

  const fbs = feedback.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/submissions"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ChevronLeft size={16} /> My submissions
      </Link>

      <div className="flex items-center gap-2">
        <Badge kind={submission.submission_type}>{submission.submission_type}</Badge>
        <Badge kind={submission.status}>{submissionStatusLabel(submission.status)}</Badge>
      </div>
      <h1 className="text-2xl font-bold">{exercise.data?.title ?? "Submission"}</h1>
      <p className="text-xs text-zinc-500">
        Submitted {dateLabel(submission.submitted_at)}
      </p>

      {exercise.data && (
        <Card className="bg-zinc-50">
          <p className="text-sm font-semibold text-zinc-500">Prompt</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">
            {exercise.data.prompt_text}
          </p>
        </Card>
      )}

      <Card>
        <p className="text-sm font-semibold text-zinc-500">Your answer</p>
        {submission.answers ? (
          <AnswersReview questions={exercise.data?.questions || []} answersPayload={submission.answers} />
        ) : submission.writing_text ? (
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">
            {submission.writing_text}
          </p>
        ) : submission.audio_recording_url ? (
          <audio controls src={submission.audio_recording_url} className="mt-2 w-full" />
        ) : (
          <p className="mt-1 text-sm text-zinc-400">No content.</p>
        )}
      </Card>

      {feedback.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : fbs.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-700">Feedback history</h2>
          {fbs.map((item) => (
            <Card key={item.id} accent={item.is_ai_generated} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.is_ai_generated ? (
                    <>
                      <AiTag />
                      <span className="text-sm font-medium">AI Feedback</span>
                    </>
                  ) : (
                    <>
                      <Avatar name="Teacher" size={28} />
                      <span className="text-sm font-medium">Teacher feedback</span>
                    </>
                  )}
                </div>
                <Badge kind="graded">{formatScore(item.score)}/100</Badge>
              </div>
              {item.comments && (
                <p className="whitespace-pre-wrap text-sm text-zinc-700">{item.comments}</p>
              )}
              <p className="text-xs text-zinc-400">{timeAgo(item.created_at)}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-sm text-zinc-500">Awaiting feedback.</Card>
      )}
    </div>
  );
}

interface GradeForm {
  score: string;
  comments: string;
}

function TeacherGradingScreen() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const inbox = useSubmissionsInbox();
  const submission = inbox.data?.find((s) => s.id === id);
  const exercise = useExercise(submission?.exercise_id ?? NaN);
  const feedback = useSubmissionFeedback(id);

  const createFeedback = useCreateFeedback();
  const aiEvaluate = useAiEvaluate(id);

  const [formError, setFormError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GradeForm>({
    defaultValues: { score: "", comments: "" },
  });

  if (inbox.isLoading) return <Skeleton className="h-64 w-full" />;
  if (inbox.isError) return <ErrorState message="Couldn’t load submissions." />;
  if (!submission) return <ErrorState message="Submission not found in your inbox." />;

  const fbs = feedback.data ?? [];

  const onSubmit = async (data: GradeForm) => {
    setFormError(null);
    const parsedScore = Number(data.score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      setFormError("Score must be between 0 and 100.");
      return;
    }

    try {
      await createFeedback.mutateAsync({
        submission_id: id,
        score: data.score,
        comments: data.comments,
      });
      reset();
      // Back to inbox after successful grading
      router.push("/submissions");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to submit feedback.");
    }
  };

  const handleAiEvaluate = async () => {
    setAiError(null);
    try {
      await aiEvaluate.mutateAsync();
    } catch (err) {
      setAiError(err instanceof ApiError ? err.message : "AI evaluation failed.");
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/submissions"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ChevronLeft size={16} /> Submissions inbox
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold capitalize">Grade {submission.student_name}’s response</h1>
          <p className="text-xs text-zinc-500">Submitted {dateLabel(submission.submitted_at)}</p>
        </div>
        <Badge kind={submission.status}>{submissionStatusLabel(submission.status)}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column: Prompt & Student Response */}
        <div className="space-y-4">
          {exercise.data && (
            <Card className="bg-zinc-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-500">Prompt</span>
                <Badge kind={exercise.data.exercise_type}>{exercise.data.exercise_type}</Badge>
              </div>
              <h2 className="text-lg font-bold text-zinc-800">{exercise.data.title}</h2>
              <p className="whitespace-pre-wrap text-sm text-zinc-700">{exercise.data.prompt_text}</p>
              {exercise.data.audio_prompt_url && (
                <audio controls src={exercise.data.audio_prompt_url} className="w-full mt-2" />
              )}
            </Card>
          )}

          <Card className="space-y-2">
            <span className="text-sm font-semibold text-zinc-500">Student Response</span>
            {submission.answers ? (
              <AnswersReview questions={exercise.data?.questions || []} answersPayload={submission.answers} />
            ) : submission.writing_text ? (
              <p className="whitespace-pre-wrap text-sm text-zinc-800">{submission.writing_text}</p>
            ) : submission.audio_recording_url ? (
              <audio controls src={submission.audio_recording_url} className="w-full mt-2" />
            ) : (
              <p className="text-sm text-zinc-400">No content submitted.</p>
            )}
          </Card>
        </div>

        {/* Right column: Feedback history & Grading Form */}
        <div className="space-y-4">
          {/* AI grading option */}
          {submission.status === "pending" && (
            <Card className="space-y-3 border-violet-200 bg-violet-50/30">
              <div>
                <h3 className="font-bold text-violet-800 flex items-center gap-1.5">
                  AI Evaluation
                  <AiTag />
                </h3>
                <p className="text-xs text-violet-600 mt-0.5">
                  Request automatic grading and diagnostic feedback.
                </p>
              </div>
              {aiError && <p className="text-sm text-red-600 font-medium">{aiError}</p>}
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-white hover:bg-violet-50 text-violet-700 border-violet-300"
                loading={aiEvaluate.isPending}
                onClick={handleAiEvaluate}
              >
                Request AI feedback
              </Button>
            </Card>
          )}

          {/* Feedback list */}
          {feedback.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : fbs.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-700">Feedback history</h3>
              {fbs.map((fb) => (
                <Card key={fb.id} accent={fb.is_ai_generated} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {fb.is_ai_generated ? (
                        <>
                          <AiTag />
                          <span className="text-sm font-medium">AI Feedback</span>
                        </>
                      ) : (
                        <>
                          <Avatar name="Teacher" size={28} />
                          <span className="text-sm font-medium">Teacher feedback</span>
                        </>
                      )}
                    </div>
                    <Badge kind="graded">{formatScore(fb.score)}/100</Badge>
                  </div>
                  {fb.comments && (
                    <p className="whitespace-pre-wrap text-sm text-zinc-700">{fb.comments}</p>
                  )}
                  <p className="text-xs text-zinc-400">{timeAgo(fb.created_at)}</p>
                </Card>
              ))}
            </div>
          ) : null}

          {/* New Feedback Form */}
          <Card className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-800">Add Teacher Feedback</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}

              <TextField
                label="Score (0 - 100)"
                placeholder="85"
                type="number"
                error={errors.score?.message}
                {...register("score", {
                  required: "Score is required",
                  min: { value: 0, message: "Minimum score is 0" },
                  max: { value: 100, message: "Maximum score is 100" },
                })}
              />

              <TextArea
                label="Comments"
                placeholder="Write your constructive feedback here..."
                rows={4}
                error={errors.comments?.message}
                {...register("comments", {
                  required: "Comments are required",
                })}
              />

              <Button
                type="submit"
                className="w-full bg-teal-600 text-white hover:bg-teal-700"
                loading={createFeedback.isPending}
              >
                Submit Feedback
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
