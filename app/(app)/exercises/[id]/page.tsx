"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mic, Square } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCreateSubmission, useExercise, useAiPractice } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { Badge, Button, Card, ErrorState, Skeleton, AiTag } from "@/components/ui";
import { wordCount, formatScore } from "@/lib/format";
import type { Feedback } from "@/lib/types";
import { AnswerState, buildAnswers, isComplete } from "@/lib/exercises";
import { QuestionCard } from "@/components/quiz/QuestionCard";

export default function ExerciseViewerPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const exercise = useExercise(id);
  const createSubmission = useCreateSubmission();
  const aiPractice = useAiPractice();

  const [text, setText] = useState("");
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [aiFeedback, setAiFeedback] = useState<Feedback | null>(null);
  const [aiPracticeError, setAiPracticeError] = useState<string | null>(null);
  const draftKey = `elw_draft_ex_${id}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          if (parsed.text !== undefined) setText(parsed.text);
          if (parsed.answers !== undefined) setAnswers(parsed.answers);
        } else {
          setText(saved);
        }
      } catch {
        setText(saved);
      }
    }
  }, [draftKey]);

  const ex = exercise.data;
  if (exercise.isLoading) return <Skeleton className="h-64 w-full" />;
  if (exercise.isError || !ex) {
    return <ErrorState message="Couldn’t load this exercise." />;
  }

  const isSpeaking = ex.exercise_type === "speaking";
  const isWriting = ex.exercise_type === "writing";
  const isWritingOrSpeaking = isWriting || isSpeaking;
  const isQuizLike = ex.exercise_type === "reading" || ex.exercise_type === "listening" || ex.exercise_type === "quiz";

  const disableSubmit = isSpeaking 
    ? !audioUrl.trim() 
    : isWriting 
      ? !text.trim()
      : !isComplete(ex.questions || [], answers);

  function saveDraft() {
    const payload = JSON.stringify({ text, answers });
    window.localStorage.setItem(draftKey, payload);
  }

  async function submit() {
    if (!ex) return;
    setError(null);
    setAiFeedback(null);
    setAiPracticeError(null);
    try {
      await createSubmission.mutateAsync({
        exercise_id: id,
        submission_type: ex.exercise_type,
        writing_text: isWriting ? text : null,
        audio_recording_url: isSpeaking ? audioUrl : null,
        answers: isQuizLike ? buildAnswers(ex.questions || [], answers) : undefined,
      });
      window.localStorage.removeItem(draftKey);
      router.push("/submissions");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn’t submit.");
    }
  }

  async function handleGetAiFeedback() {
    if (!ex || !isWritingOrSpeaking) return;
    setError(null);
    setAiFeedback(null);
    setAiPracticeError(null);
    try {
      const res = await aiPractice.mutateAsync({
        exercise_id: id,
        writing_text: isSpeaking ? null : text,
        audio_recording_url: isSpeaking ? audioUrl : null,
      });
      setAiFeedback(res.feedback);
      window.localStorage.removeItem(draftKey);
    } catch (err) {
      setAiPracticeError(err instanceof ApiError ? err.message : "AI feedback failed.");
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setAudioUrl(reader.result);
          }
        };
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      setError("Could not access microphone.");
    }
  }

  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  }

  function clearRecording() {
    setAudioUrl("");
  }

  const handleAnswerChange = (questionId: number, state: AnswerState) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: state,
    }));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-4">
        <Link
          href={ex.module_id ? `/modules/${ex.module_id}` : "/modules"}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ChevronLeft size={16} /> Back
        </Link>
        <div>
          <div className="mb-3">
            <Badge kind={ex.exercise_type}>{ex.exercise_type}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{ex.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        {/* Left Column: Prompt / Passage / Audio */}
        <div className="space-y-6">
          <Card className="bg-zinc-50">
            <p className="text-sm font-semibold text-zinc-500">Prompt</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">{ex.prompt_text}</p>
          </Card>

          {ex.exercise_type === "speaking" && ex.audio_prompt_url && (
            <Card className="bg-zinc-50">
              <p className="text-sm font-semibold text-zinc-500">Audio Prompt</p>
              <audio controls src={ex.audio_prompt_url} className="mt-3 w-full" />
            </Card>
          )}

          {ex.exercise_type === "listening" && ex.audio_prompt_url && (
            <Card className="bg-zinc-50">
              <p className="text-sm font-semibold text-zinc-500">Listen</p>
              <audio controls src={ex.audio_prompt_url} className="mt-3 w-full" />
            </Card>
          )}

          {ex.exercise_type === "reading" && ex.content_text && (
            <Card className="bg-zinc-50">
              <p className="text-sm font-semibold text-zinc-500">Passage</p>
              <div className="mt-3 prose prose-sm max-w-none text-zinc-800 whitespace-pre-wrap">
                {ex.content_text}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Response Area (Writing/Speaking) OR Questions (Quiz) */}
        <div className="space-y-6">
          {isSpeaking ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-zinc-700">Your recording</label>
              {!audioUrl ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 rounded-lg bg-zinc-50">
                  <Button
                    type="button"
                    variant={isRecording ? "danger" : "outline"}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? (
                      <>
                        <Square className="h-4 w-4" /> Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" /> Start Recording
                      </>
                    )}
                  </Button>
                  {isRecording && <p className="mt-4 text-sm text-red-500 animate-pulse">Recording...</p>}
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-4 border border-zinc-200 rounded-lg bg-zinc-50">
                  <audio src={audioUrl} controls className="w-full" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearRecording}
                    className="self-end"
                  >
                    Discard and Re-record
                  </Button>
                </div>
              )}
            </div>
          ) : isWriting ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700">Your response</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start typing…"
                className="min-h-64 lg:min-h-[400px] w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 resize-y"
              />
              <p className="text-xs text-zinc-400">{wordCount(text)} words</p>
            </div>
          ) : isQuizLike ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-zinc-700">Questions</label>
              {ex.questions && ex.questions.length > 0 ? (
                ex.questions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    number={idx + 1}
                    question={q}
                    answer={answers[q.id]}
                    onChange={(ans) => handleAnswerChange(q.id, ans)}
                    disabled={createSubmission.isPending}
                  />
                ))
              ) : (
                <p className="text-sm text-zinc-500 italic">No questions available for this exercise.</p>
              )}
            </div>
          ) : null}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {aiPracticeError && <p className="text-sm text-red-600 font-medium">{aiPracticeError}</p>}

          <div className="flex flex-wrap gap-2">
            {!isSpeaking && (
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={createSubmission.isPending || aiPractice.isPending}
              >
                Save draft
              </Button>
            )}
            <Button
              onClick={submit}
              loading={createSubmission.isPending}
              disabled={disableSubmit || aiPractice.isPending}
            >
              Submit
            </Button>
            {isWritingOrSpeaking && (
              <Button
                variant="outline"
                onClick={handleGetAiFeedback}
                loading={aiPractice.isPending}
                disabled={disableSubmit || createSubmission.isPending}
                className="border-violet-300 hover:bg-violet-50 text-violet-700"
              >
                Get AI feedback
              </Button>
            )}
          </div>

          {aiFeedback && (
            <Card accent className="space-y-2 border-violet-200 bg-violet-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AiTag />
                  <span className="text-sm font-bold text-violet-800">Instant AI Feedback</span>
                </div>
                <Badge kind="graded">{formatScore(aiFeedback.score)}/100</Badge>
              </div>
              <p className="text-xs text-zinc-500">Practice submission (no teacher involved)</p>
              {aiFeedback.comments && (
                <p className="whitespace-pre-wrap text-sm text-zinc-700 mt-2">{aiFeedback.comments}</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
