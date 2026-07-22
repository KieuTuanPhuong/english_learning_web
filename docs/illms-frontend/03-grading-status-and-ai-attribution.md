# 03 — Grading status & AI-feedback attribution

**Status:** Proposed · **Depends on:** [01](./01-types-and-api-client.md), [02](./02-dashboards-and-inbox.md) · **Backend refs:** `Submission.status` (pending/graded/ai_graded), `Feedback.is_ai_generated` (english-learning-api/docs/illms-upgrade/01, 04)

**Blast radius:** `components/ui.tsx` (`Badge` kind map + small `AiTag`), `app/(app)/submissions/[id]/page.tsx` (student detail + teacher grading branch), `app/(app)/submissions/page.tsx` (student list status), `lib/format.ts` (status label helper, optional).

---

## Goal
Make the new grading model visible: a real `Submission.status` badge everywhere submissions are listed/shown, and clear attribution of AI-generated vs teacher feedback. Build the teacher grading screen (currently a placeholder) so feedback posting drives the status transition the backend now performs.

## Why (gap)
- The FE infers "graded/awaiting" from *feedback existence* (`app/(app)/submissions/page.tsx`, `submissions/[id]/page.tsx`, and the now-removed `useFeedbackMap`). The backend now has an explicit `Submission.status` ∈ `pending|graded|ai_graded` — use it directly.
- `Feedback` now has `is_ai_generated`; AI feedback has `reviewer_id = null`. The current submission-detail feedback card assumes a human reviewer — it must not (backend safeguard "nullable evaluator").
- `components/ui.tsx` `Badge` already maps `graded`/`ungraded`/`pending`/`submitted` kinds but has **no `ai_graded`** kind.
- `app/(app)/submissions/[id]/page.tsx` teacher branch is a `<RolePlaceholder>` — the grading screen (T24) needs building; `createFeedback` already exists in `lib/api.ts` and `useCreateFeedback` in `lib/hooks.ts`.

## Changes (file by file)

### `components/ui.tsx`
Add an `ai_graded` entry to the `Badge` kind color map (use a distinct hue from teacher `graded` to read as machine-graded, e.g. violet):
```tsx
// in the BADGE kind→class map
ai_graded: "bg-violet-100 text-violet-700 ring-violet-600/20",
```
Add a tiny attribution tag for feedback cards:
```tsx
export function AiTag() {
  return <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700">AI</span>;
}
```

### `lib/format.ts` (optional helper)
```ts
export function submissionStatusLabel(s: string): string {
  return { pending: "Pending", graded: "Graded", ai_graded: "AI graded" }[s] ?? s;
}
```

### `app/(app)/submissions/page.tsx` (student list)
Replace feedback-presence inference with `submission.status`:
```tsx
<Badge kind={s.status}>{submissionStatusLabel(s.status)}</Badge>
// filter tabs (All / Graded / Awaiting) → filter on status === "pending" vs in ("graded","ai_graded")
```

### `app/(app)/submissions/[id]/page.tsx`
**Student detail:** show `<Badge kind={submission.status}/>`; for each feedback entry render `is_ai_generated ? <AiTag/> : <Avatar/reviewer>`; never assume `reviewer_id` is non-null. Keep score formatting via `lib/format.ts` (string decimals).
**Teacher grading branch (T24):** replace `<RolePlaceholder>` with the grading form:
```tsx
// react-hook-form: score (0–100, number→string) + comments (textarea)
const m = useCreateFeedback();
const onSubmit = (v) => m.mutate(
  { submission_id: id, score: String(v.score), comments: v.comments },
  { onSuccess: () => { /* invalidate qk.submissionFeedback(id) + qk.submissionsInbox() + qk.dashboard */ } }
);
// show the student's response (writing_text or audio_recording_url) beside the prompt
// list existing feedback (incl AI ones with <AiTag/>)
```
After a human feedback POST the backend sets `status = graded`; invalidate the inbox + dashboard queries so counts update (supports J4 "Save & next").

> AI evaluation (the "Request AI feedback" button that produces an `ai_graded` row) is added in [brief 05](./05-ai-practice-and-evaluate.md) — this brief only needs to *display* `ai_graded` + `is_ai_generated` correctly.

## Acceptance criteria
- [ ] Student "My Submissions" badges reflect `status` (pending/graded/ai_graded), not feedback-count inference.
- [ ] Submission detail renders an AI feedback row with the `AiTag` and no broken reviewer avatar (seed/produce an `is_ai_generated` feedback to verify).
- [ ] Teacher grading screen posts score (0–100) + comments; submission flips to `graded`; inbox/dashboard counts refresh without a page reload.
- [ ] Out-of-range score (e.g. 150) is rejected client-side and the server 400 (`{score:[...]}`) is surfaced via the existing `ApiError.fieldErrors` path.
- [ ] `yarn typecheck` / `yarn lint` pass.

## Deferred / out of scope
- Triggering AI evaluation / AI practice → [brief 05](./05-ai-practice-and-evaluate.md).
- "Save & next" auto-advance polish is optional; a return-to-inbox after save satisfies J4.
