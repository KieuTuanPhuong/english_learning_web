# 01 — Types & API client foundation

**Status:** Proposed · **Depends on:** none (foundation) · **Backend refs:** all new endpoints in `english-learning-api/docs/illms-upgrade/` · **Audience:** AI coding agent updating the Next.js client

**Blast radius:** `lib/types/api.d.ts` (regenerated), `lib/types/index.ts` (+aliases), `lib/api.ts` (+endpoint fns), `lib/query-keys.ts` (+keys). No UI yet — this brief makes the new backend surface callable & typed. Every other brief depends on it.

---

## Goal
Regenerate the OpenAPI types against the upgraded backend and extend the API client + query-key factory so the new endpoints (dashboard, teacher inbox, study materials, AI practice/evaluate, grade-report export) and new fields (`Submission.status`, `Feedback.is_ai_generated`, `Exercise.content_text`/`created_by`) are typed and callable. No screens change here.

## Why (gap)
- `lib/types/api.d.ts` was generated against the **old** schema — it has no `StudyMaterial`, `Submission.status`, `Feedback.is_ai_generated`, dashboard, or inbox types.
- `lib/api.ts` has functions only for the pre-upgrade endpoints (see its `// ---- Resources` / `// ---- Teacher mutations` sections). Nothing calls `/api/dashboard/`, `/api/submissions/inbox/`, `/api/study-materials/`, `/api/submissions/{id}/ai-evaluate/`, `/api/submissions/ai-practice/`, or `/api/reports/grades`.
- `lib/query-keys.ts` (`qk`) has no keys for those resources.

## Changes (file by file)

### `lib/types/api.d.ts` — regenerate (do this first)
The repo generates types from the live schema. Bring the backend up, migrated + seeded, then:

```bash
# in english-learning-api: ./venv/bin/python manage.py migrate && seed_demo && runserver
# in english-learning-web:
yarn gen:api          # = openapi-typescript http://127.0.0.1:8000/api/schema/ -o lib/types/api.d.ts
```

New fields on **existing** schemas (`Exercise.content_text`, `Exercise.created_by`, `Submission.status`, `Feedback.is_ai_generated`, `Feedback.score` 0–100) flow through automatically — no manual edit. New component schemas appear too: inspect the file for the exact (drf-spectacular-mangled) keys before aliasing — likely `StudyMaterial`, `SubmissionInbox`, `Dashboard`, `Health`, `ActivityItem`, `AiModel`, plus enums like `SubmissionStatusEnum`/`GradingStrictnessEnum` and request bodies `StudyMaterialRequest`, `AiPracticeRequest`.

> ⚠️ Names are whatever spectacular emits. Open `api.d.ts` and copy the real keys — do not assume. If the backend isn't reachable, the existing file still compiles; the regen is required for the new aliases below to resolve.

### `lib/types/index.ts` — add aliases (mirror the existing `S[...]` pattern)
Append next to the current aliases:

```ts
// --- ILLMS upgrade ---
export type SubmissionStatus = S["SubmissionStatusEnum"]; // "pending" | "graded" | "ai_graded"  (verify key)
export type StudyMaterial = S["StudyMaterial"];
export type StudyMaterialRequest = S["StudyMaterialRequest"];
export type SubmissionInbox = S["SubmissionInbox"];       // submission + is_graded/grading_source/latest_score/student_name
export type AiPracticeRequest = S["AiPracticeRequest"];

// The dashboard `data` payload is a free-form DictField in the schema, so the
// generated `Dashboard` type does NOT capture per-role shape. Hand-type it:
export type DashboardEnvelope = { role: Role; generated_at: string; data: unknown };
export type StudentDashboard = {
  due_assignments: Assignment[];
  in_progress_modules: Progress[];
  recent_feedback: Feedback[];
};
export type TeacherDashboard = {
  class_count: number;
  enrolled_student_count: number;
  ungraded_submission_count: number;
  classes: Class[];
  recent_ungraded: Submission[];
};
```

> The `Dashboard` `data` is untyped by design (backend `DictField`). Treat `envelope.data` as the role-specific type above based on `envelope.role`. (Admin dashboard shape is out of scope — no admin brief in this set.)

### `lib/api.ts` — add endpoint functions
Follow the existing `apiFetch<T>` convention (one fn per endpoint, FK ids flat). Add:

```ts
import type { StudyMaterial, StudyMaterialRequest, SubmissionInbox,
  AiPracticeRequest, Submission, Feedback, DashboardEnvelope } from "./types";

// Dashboard (role-aware; data shape depends on me.role)
export function getDashboard(): Promise<DashboardEnvelope> {
  return apiFetch<DashboardEnvelope>("/api/dashboard/");
}

// Teacher inbox — replaces the client-side grading-queue fan-out (see brief 02)
export function listSubmissionsInbox(params?: {
  status?: string; class_id?: number; exercise_id?: number;
}): Promise<SubmissionInbox[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.class_id != null) qs.set("class_id", String(params.class_id));
  if (params?.exercise_id != null) qs.set("exercise_id", String(params.exercise_id));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<SubmissionInbox[]>(`/api/submissions/inbox/${suffix}`);
}

// AI evaluation (teacher/admin triggers AI grading on an existing submission)
export function aiEvaluateSubmission(id: number): Promise<Feedback> {
  return apiFetch<Feedback>(`/api/submissions/${id}/ai-evaluate/`, { method: "POST" });
}

// AI practice (student): returns { submission, feedback }
export function aiPractice(body: AiPracticeRequest): Promise<{ submission: Submission; feedback: Feedback }> {
  return apiFetch("/api/submissions/ai-practice/", { method: "POST", body: JSON.stringify(body) });
}

// Study materials
export function listStudyMaterials(): Promise<StudyMaterial[]> {
  return apiFetch<StudyMaterial[]>("/api/study-materials/");
}
export function getStudyMaterial(id: number): Promise<StudyMaterial> {
  return apiFetch<StudyMaterial>(`/api/study-materials/${id}/`);
}
export function createStudyMaterial(body: StudyMaterialRequest): Promise<StudyMaterial> {
  return apiFetch<StudyMaterial>("/api/study-materials/", { method: "POST", body: JSON.stringify(body) });
}
export function updateStudyMaterial(id: number, body: Partial<StudyMaterialRequest>): Promise<StudyMaterial> {
  return apiFetch<StudyMaterial>(`/api/study-materials/${id}/`, { method: "PATCH", body: JSON.stringify(body) });
}
export function deleteStudyMaterial(id: number): Promise<void> {
  return apiFetch<void>(`/api/study-materials/${id}/`, { method: "DELETE" });
}
```

> The grade-report **CSV download** is NOT a JSON call — `apiFetch` does `res.json()`. Its dedicated raw-fetch helper is defined in [brief 06](./06-reports-csv-export.md), not here.

### `lib/query-keys.ts` — add keys
```ts
  dashboard: ["dashboard"] as const,
  submissionsInbox: (f?: { status?: string; class_id?: number; exercise_id?: number }) =>
    ["submissions", "inbox", f ?? {}] as const,
  studyMaterials: ["study-materials"] as const,
  studyMaterial: (id: number) => ["study-materials", id] as const,
```

## Conventions to respect (from `docs/IMPLEMENTATION_PLAN.md`)
- **Decimals are JSON strings** (`score`, `auto_score`, `latest_score`, `completion_percentage`) — parse/format with `lib/format.ts`, never `Number()` blindly in render.
- **Lists are bare arrays** (no `{results}` envelope).
- **Login** returns `access_token`/`refresh_token`; refresh uses `refresh`/`access` (already handled in `api.ts`).
- **Next.js 16:** keep new code in `"use client"` entry points; `await params`/`searchParams`; wrap `useSearchParams` consumers in `<Suspense>`; no webpack config; `NEXT_PUBLIC_API_URL` read as a literal.

## Acceptance criteria
- [ ] `yarn gen:api` succeeds against the upgraded backend and `lib/types/api.d.ts` contains `StudyMaterial`, `Submission.status`, `Feedback.is_ai_generated`.
- [ ] `yarn typecheck` passes after adding the aliases + client fns (every `S["..."]` alias resolves to a real key).
- [ ] `yarn lint` clean.
- [ ] A throwaway call (e.g. in a scratch component) to `getDashboard()` / `listSubmissionsInbox()` returns 200 with a seeded teacher/student token.

## Deferred / out of scope
- Admin-only resources (`/api/ai-models/`, `/api/admin/activity/`, `/api/admin/health/`, admin dashboard `data` shape) — no admin console in this set.
- Any UI — purely the type+client layer. Screens land in briefs 02–07.
