"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useExercise, useMySubmissions, useSubmissionFeedback } from "@/lib/hooks";
import {
  Avatar,
  Badge,
  Card,
  ErrorState,
  RolePlaceholder,
  Skeleton,
} from "@/components/ui";
import { dateLabel, formatScore, timeAgo } from "@/lib/format";

export default function SubmissionDetailPage() {
  const { role } = useAuth();
  if (role === "student") return <StudentSubmissionDetail />;
  return <RolePlaceholder feature="Grading (teacher)" />;
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

  const fb = feedback.data?.[feedback.data.length - 1];

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
        {fb ? <Badge kind="graded">Graded</Badge> : <Badge kind="ungraded">Awaiting</Badge>}
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
        {submission.writing_text ? (
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
      ) : fb ? (
        <Card accent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar name="Teacher" size={28} />
              <span className="text-sm font-medium">Teacher feedback</span>
            </div>
            <Badge kind="graded">{formatScore(fb.score)}/100</Badge>
          </div>
          {fb.comments && (
            <p className="whitespace-pre-wrap text-sm text-zinc-700">{fb.comments}</p>
          )}
          <p className="text-xs text-zinc-400">{timeAgo(fb.created_at)}</p>
        </Card>
      ) : (
        <Card className="text-sm text-zinc-500">Awaiting teacher feedback.</Card>
      )}
    </div>
  );
}
