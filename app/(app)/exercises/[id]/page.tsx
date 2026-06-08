"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCreateSubmission, useExercise } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { Badge, Button, Card, ErrorState, Skeleton, TextField } from "@/components/ui";
import { wordCount } from "@/lib/format";

export default function ExerciseViewerPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const exercise = useExercise(id);
  const createSubmission = useCreateSubmission();

  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const draftKey = `elw_draft_ex_${id}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(draftKey);
    // Hydration-safe: render default, then load any local draft after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setText(saved);
  }, [draftKey]);

  const ex = exercise.data;
  const isSpeaking = ex?.exercise_type === "speaking";

  function saveDraft() {
    window.localStorage.setItem(draftKey, text);
  }

  async function submit() {
    if (!ex) return;
    setError(null);
    try {
      await createSubmission.mutateAsync({
        exercise_id: id,
        submission_type: ex.exercise_type,
        writing_text: isSpeaking ? null : text,
        audio_recording_url: isSpeaking ? audioUrl : null,
      });
      window.localStorage.removeItem(draftKey);
      router.push("/submissions");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn’t submit.");
    }
  }

  if (exercise.isLoading) return <Skeleton className="h-64 w-full" />;
  if (exercise.isError || !ex) {
    return <ErrorState message="Couldn’t load this exercise." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={ex.module_id ? `/modules/${ex.module_id}` : "/modules"}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ChevronLeft size={16} /> Back
      </Link>
      <Badge kind={ex.exercise_type}>{ex.exercise_type}</Badge>
      <h1 className="text-2xl font-bold">{ex.title}</h1>

      <Card className="bg-zinc-50">
        <p className="text-sm font-semibold text-zinc-500">Prompt</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{ex.prompt_text}</p>
        {isSpeaking && ex.audio_prompt_url && (
          <audio controls src={ex.audio_prompt_url} className="mt-3 w-full" />
        )}
      </Card>

      {isSpeaking ? (
        <TextField
          label="Your recording (paste an audio URL)"
          placeholder="https://…/me.mp3"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
        />
      ) : (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Your response</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing…"
            className="min-h-48 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <p className="text-xs text-zinc-400">{wordCount(text)} words</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        {!isSpeaking && (
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={createSubmission.isPending}
          >
            Save draft
          </Button>
        )}
        <Button
          onClick={submit}
          loading={createSubmission.isPending}
          disabled={isSpeaking ? !audioUrl.trim() : !text.trim()}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
