# 05 — AI practice (student) & AI evaluate (teacher)

**Status:** Proposed · **Depends on:** [01](./01-types-and-api-client.md), [03](./03-grading-status-and-ai-attribution.md) · **Backend refs:** `POST /api/submissions/ai-practice/`, `POST /api/submissions/{id}/ai-evaluate/` (english-learning-api/docs/illms-upgrade/06)

**Blast radius:** `lib/hooks.ts` (+`useAiPractice`, +`useAiEvaluate`), `app/(app)/exercises/[id]/page.tsx` (student practice mode), `app/(app)/submissions/[id]/page.tsx` (teacher "Request AI feedback").

---

## Goal
Expose the AI evaluation suite to the UI: students get instant AI feedback on off-assignment practice; teachers can trigger AI grading on a submission from the grading screen. Both use the default mock backend — no keys, deterministic scores.

## Why (gap)
No AI affordances exist (Explore map §6). Backend now offers: `ai-practice` (student; creates a self-practice submission + returns `{submission, feedback}` with `is_ai_generated`), and `ai-evaluate` (teacher/admin; writes an `ai_graded` feedback row on an existing submission). AI feedback always has `reviewer_id = null`, `is_ai_generated = true`.

> **Skill-type caveat:** AI grading is meaningful for **writing/speaking** (productive). For receptive types (`reading/listening/quiz`) the backend mock grades empty text (~50) — gate the practice UI to `exercise_type ∈ {writing, speaking}` and keep using normal submission + auto-grade (`answers`) for receptive exercises.

## Changes (file by file)

### `lib/hooks.ts`
```ts
export function useAiPractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.aiPractice,                                  // (AiPracticeRequest) -> {submission, feedback}
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.mySubmissions }),
  });
}
export function useAiEvaluate(submissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.aiEvaluateSubmission(submissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.submissionFeedback(submissionId) });
      qc.invalidateQueries({ queryKey: qk.submissionsInbox() });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}
```

### `app/(app)/exercises/[id]/page.tsx` (student practice mode)
On writing/speaking exercises, add a secondary action next to the existing Submit: **"Get AI feedback"** (off-assignment practice). It calls `useAiPractice()` with `{ exercise_id, writing_text }` (writing) or `{ exercise_id, audio_recording_url }` (speaking), then shows the returned `feedback` inline (score via `lib/format.ts`, comments, `<AiTag/>` from brief 03). The normal "Submit" path (assignment) is unchanged. Make clear in copy this is practice (no teacher involved).

> Keep it on the existing exercise viewer rather than a new route — minimal surface, reuses the prompt/response UI. (A dedicated `/practice` catalog is optional; not required.)

### `app/(app)/submissions/[id]/page.tsx` (teacher grading — extends brief 03)
Add a **"Request AI feedback"** button to the teacher grading branch. It calls `useAiEvaluate(id)`; on success the new `ai_graded` feedback row appears (with `<AiTag/>`) and the submission status badge flips to `ai_graded`. Disable while pending; surface `ApiError` (e.g. 400 if a speaking submission has no `audio_recording_url`, or 400 if `AI_BACKEND=real` is unwired — backend returns the stub message).

## Acceptance criteria
- [ ] Student on a writing exercise clicks "Get AI feedback" → sees an AI score + comments inline; the practice submission appears in "My Submissions" as `ai_graded`.
- [ ] "Get AI feedback" is hidden/disabled on reading/listening/quiz exercises.
- [ ] Teacher on a pending submission clicks "Request AI feedback" → an `is_ai_generated` feedback row appears, status → `ai_graded`, inbox/dashboard counts refresh.
- [ ] Errors (missing audio; real-backend unwired) surface via the existing `ApiError` path, not a crash.
- [ ] `yarn typecheck`/`yarn lint` pass.

## Deferred / out of scope
- Real Whisper/LLM output (backend default is the deterministic mock).
- Async/streamed evaluation UX — calls are synchronous for MVP.
- Live speaking session over WebSocket → [brief 07](./07-realtime-websockets.md).
