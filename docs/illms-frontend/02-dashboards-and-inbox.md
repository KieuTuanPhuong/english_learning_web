# 02 — Dashboards & teacher inbox (replace client-side fan-outs)

**Status:** Proposed · **Depends on:** [01 — Types & API client](./01-types-and-api-client.md) · **Backend refs:** `GET /api/dashboard/`, `GET /api/submissions/inbox/` (english-learning-api/docs/illms-upgrade/04, 05)

**Blast radius:** `lib/hooks.ts` (+`useDashboard`, +`useSubmissionsInbox`; retire 3 fan-out hooks), `app/(app)/dashboard/page.tsx` (student + teacher), `app/(app)/submissions/page.tsx` (teacher inbox branch). Net deletion of query-fan-out code.

---

## Goal
Swap the three client-side aggregation hooks for the real server endpoints the backend now provides, and light up the two teacher screens that are currently `RolePlaceholder`s (teacher dashboard + submissions inbox).

## Why (gap)
The FE built workarounds because the old API had no aggregate endpoints (`docs/IMPLEMENTATION_PLAN.md` §9 M2). The upgrade removes the need:

| Current workaround (`lib/hooks.ts`) | What it does today | Replace with |
|---|---|---|
| `useDueAssignments()` | fans out `classes` → per-class `assignments`, flattens | `GET /api/dashboard/` (student `data.due_assignments`) |
| `useGradingQueue()` | fans out `classes` → `assignments` → unique `exercise_id`s → `exercises/{id}/submissions/` + rosters for names | `GET /api/submissions/inbox/` (one call; includes `student_name`) |
| `useFeedbackMap()` | per-submission `feedback` calls to derive graded/score | inbox row fields `is_graded`, `latest_score`, `grading_source` |

Today `app/(app)/dashboard/page.tsx` (teacher branch) and `app/(app)/submissions/page.tsx` (teacher branch) render `<RolePlaceholder>`. The new endpoints make both buildable.

## Changes (file by file)

### `lib/hooks.ts`
Add:
```ts
import * as api from "./api";
import { qk } from "./query-keys";

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: api.getDashboard });
}

export function useSubmissionsInbox(filters?: {
  status?: string; class_id?: number; exercise_id?: number;
}) {
  return useQuery({
    queryKey: qk.submissionsInbox(filters),
    queryFn: () => api.listSubmissionsInbox(filters),
  });
}
```
Then **remove** `useDueAssignments`, `useGradingQueue`, `useFeedbackMap` and their now-unused imports (`useQueries`, the `QueueItem` type) once the two pages below stop importing them. (Grep first: `useDueAssignments|useGradingQueue|useFeedbackMap` — only the dashboard/submissions pages should reference them.)

### `app/(app)/dashboard/page.tsx`
**Student branch:** replace the `useDueAssignments()` + `useMyProgress()` + `useMySubmissions()` composition with a single `useDashboard()`; read `data` as `StudentDashboard` when `role === "student"`.
```tsx
const { data, isLoading, isError } = useDashboard();
const d = data?.data as StudentDashboard | undefined;
// render d.due_assignments / d.in_progress_modules / d.recent_feedback
// keep the existing Skeleton / ErrorState / EmptyState pattern
```
**Teacher branch:** replace `<RolePlaceholder>` with KPI tiles + recent-ungraded list from the teacher payload:
```tsx
const t = data?.data as TeacherDashboard | undefined;
// tiles: t.class_count, t.enrolled_student_count, t.ungraded_submission_count
// list: t.recent_ungraded (link each to /submissions/[id]); t.classes grid
```
Use existing `Card`, `PageHeader`, `ProgressBar`, `Badge`. Decimals (`latest_score`, progress %) format via `lib/format.ts`.

### `app/(app)/submissions/page.tsx`
Keep the **student** branch (My Submissions) as-is. Replace the **teacher** `<RolePlaceholder>` with the inbox (screen T23):
```tsx
// "use client"; wrap the filter UI that reads useSearchParams in <Suspense>
const status = useSearchParams().get("status") ?? undefined; // "" | pending | graded | ai_graded
const { data, isLoading, isError } = useSubmissionsInbox(status ? { status } : undefined);
// Tabs: All · Pending · Graded (set ?status=)  — reuse <Tabs>
// each row: <Badge kind={row.status}/> + student_name + exercise + latest_score (if is_graded)
// row links to /submissions/[id] (grading screen lives in brief 03/T24)
```
Inbox rows already carry `student_name`, `is_graded`, `grading_source` (`"ai"|"teacher"|null`), `latest_score` — no extra fetches. Status badge styling + AI attribution come from [brief 03](./03-grading-status-and-ai-attribution.md).

## Acceptance criteria
- [ ] Student dashboard renders due assignments, in-progress modules, recent feedback from **one** network call (verify in devtools — no per-class assignment fan-out).
- [ ] Teacher dashboard shows class/student/ungraded counts + recent ungraded (seeded teacher `emma.teacher@english.app`).
- [ ] Teacher `/submissions` shows the inbox; `?status=pending` filters; rows show student name + status badge; no N× feedback calls.
- [ ] `useDueAssignments`/`useGradingQueue`/`useFeedbackMap` are deleted and `yarn typecheck`/`yarn lint` pass.
- [ ] **J4** (teacher batch-grade) still reaches the grading screen from the inbox.

## Deferred / out of scope
- The grading screen itself (status transitions + AI feedback display) → [brief 03](./03-grading-status-and-ai-attribution.md).
- Admin dashboard payload → not in this set.
- Live updates to these lists on WebSocket events → [brief 07](./07-realtime-websockets.md) (optional).
