# ILLMS Frontend Update — AI-agent instructions

An **ordered set of implementation briefs** for updating this Next.js client (`english-learning-web`) to consume the **upgraded** Django backend (`english-learning-api`, see its `docs/illms-upgrade/`). Each brief is a self-contained work package.

> **Read this first**, then implement the numbered briefs in order. Pair each FE brief with its backend counterpart (cited in the brief header).

---

## What changed in the backend (why this exists)

The backend gained: a role-aware **dashboard** endpoint, a teacher **submissions inbox**, an explicit **`Submission.status`** lifecycle (`pending`/`graded`/`ai_graded`), **AI-attributed feedback** (`Feedback.is_ai_generated`, `reviewer_id` nullable), a **study-materials** library, **AI practice/evaluate** endpoints, **CSV grade-report** export, and a **WebSocket** layer. It also closed security gaps the FE plan flagged (register-as-admin is now blocked; class `teacher_id` is locked) — the FE register UI already restricted roles, so no change needed there.

The current FE (per `docs/IMPLEMENTATION_PLAN.md` + the codebase) is a client SPA: the **student flow (M1) is built**, **teacher views are mostly `RolePlaceholder`s**, and **admin (M3) is absent**. It also carries **client-side fan-out workarounds** for aggregates the old API lacked — those are now replaced by real endpoints.

### Backend surface → brief

| New/changed backend | Brief |
|---|---|
| OpenAPI schema + new fields (`status`, `is_ai_generated`, `content_text`, `created_by`) | **01** |
| `GET /dashboard/`, `GET /submissions/inbox/` (replace fan-outs) | **02** |
| `Submission.status`, `Feedback.is_ai_generated` display + grading screen | **03** |
| `/study-materials/` CRUD | **04** |
| `submissions/ai-practice/`, `submissions/{id}/ai-evaluate/` | **05** |
| `reports/grades?format=csv` | **06** |
| `ws/notifications/`, `ws/speaking/` | **07** (optional) |

---

## The briefs

| # | File | Adds | New routes/files |
|---|---|---|---|
| 01 | [01-types-and-api-client.md](./01-types-and-api-client.md) | regen types, client fns, query keys | — (lib only) |
| 02 | [02-dashboards-and-inbox.md](./02-dashboards-and-inbox.md) | real dashboards + teacher inbox; delete fan-outs | — (existing pages) |
| 03 | [03-grading-status-and-ai-attribution.md](./03-grading-status-and-ai-attribution.md) | status badges, AI attribution, grading screen | `ai_graded` badge, `AiTag` |
| 04 | [04-study-materials.md](./04-study-materials.md) | materials library (read-all, admin-manage) | `app/(app)/study-materials/`, `[id]/` |
| 05 | [05-ai-practice-and-evaluate.md](./05-ai-practice-and-evaluate.md) | student AI practice + teacher AI evaluate | — (existing pages) |
| 06 | [06-reports-csv-export.md](./06-reports-csv-export.md) | CSV grade-report download | `downloadGradeReport` |
| 07 | [07-realtime-websockets.md](./07-realtime-websockets.md) | live notifications (+optional speaking) | `lib/ws.ts` |

---

## Build order

```
01  ─►  02  ─►  03  ─►  05
        │        │
        │        └─► 04 (independent of 02/03; needs 01)
        └─► 06 (needs 01 + 02's class surfaces)
                         07 (optional; after 02/05)
```

1. **01** first — every brief needs the regenerated types + client fns.
2. **02** — dashboards + inbox (deletes the fan-out hooks; highest value).
3. **03** — status badges + AI attribution + the teacher grading screen (the inbox from 02 links into it).
4. **04** — study materials (independent feature; only needs 01).
5. **05** — AI practice/evaluate (builds on 03's `AiTag`/status display).
6. **06** — CSV export (attaches to 02's teacher class surfaces).
7. **07** — realtime (optional polish; do last).

---

## Conventions every brief obeys (from `docs/IMPLEMENTATION_PLAN.md` + `AGENTS.md`)

- **Types are generated** from the live OpenAPI schema: `yarn gen:api` → `lib/types/api.d.ts`; friendly aliases in `lib/types/index.ts`. Re-gen against the upgraded backend is step 1 (brief 01). Verify spectacular's exact schema key names before aliasing.
- **API client pattern:** one `apiFetch<T>`-based fn per endpoint in `lib/api.ts`; one TanStack Query hook per resource/action in `lib/hooks.ts`; central key factory in `lib/query-keys.ts`. Mutations invalidate the keys they touch.
- **Decimals are JSON strings** (`score`, `auto_score`, `latest_score`, `completion_percentage`) — format with `lib/format.ts`. **Lists are bare arrays.**
- **Role decides chrome, not routes** — shared URLs render role-specific views; role from `useAuth()`; accents via `data-role` (student=indigo, teacher=teal, admin=amber). `(app)/layout.tsx` guards auth.
- **Design system:** reuse `components/ui.tsx` (`Button`, `Card`, `Badge`, `TextField`/`TextArea`, `Tabs`, `Modal`, `EmptyState`/`ErrorState`/`Skeleton`, `PageHeader`, `Avatar`, `ProgressBar`) and `components/layout.tsx` shells/nav. Every list/detail needs loading + empty + error states.
- **Next.js 16** (read `node_modules/next/dist/docs/` per `AGENTS.md`): `"use client"` on interactive entry points; `await params`/`searchParams`; wrap `useSearchParams` consumers in `<Suspense>`; Turbopack only (no webpack config); Tailwind v4 `@theme` (no config file); `NEXT_PUBLIC_API_URL` read as a literal.

---

## How to use these briefs

1. Read this README + the brief and its **Depends on** list.
2. **Verify before you cite.** These reference real files (`lib/api.ts`, `lib/hooks.ts`, `components/ui.tsx`, the `app/(app)/...` pages) but the tree may move — `grep`/open the file and confirm symbol names (e.g. the exact `useAuth` register fn name, the `Badge` kind map, generated schema keys) before editing.
3. Make the changes, then run `yarn gen:api` (if backend changed), `yarn typecheck`, `yarn lint`, and the brief's acceptance checks against the **live upgraded backend** (seeded users, all `password123`: `admin@english.app`, `*.teacher@english.app`, `*.student@english.app`).
4. Keep changes additive and consistent with the existing pattern; don't introduce a second data-fetching style.

## Not covered (out of scope for this set)

- **Admin console (M3)** — user management, all-classes/modules, AI-model config, activity feed, system health, admin dashboard. The backend supports it (`/api/users/?search&role&status` admin-only, `/api/ai-models/`, `/api/admin/activity/`, `/api/admin/health/`), but it's a separate milestone. Note `GET /api/users/` is still **admin-only**, so the teacher enroll-by-search remains impossible — teachers enroll by student ID (unchanged).
- **Completing the base teacher flow (T14–T22)** — class/module/lesson-plan/assignment CRUD screens that don't depend on the backend upgrade. Track those in `docs/IMPLEMENTATION_PLAN.md` / `docs/BUILD_WORKFLOW.md` (M2). These briefs only touch teacher screens the upgrade directly enables (dashboard, inbox, grading).

### Provenance & confidence
Authored against the FE codebase and the upgraded backend (reviewed + tested: 13/13 backend tests green). Briefs are internally consistent and reference real files, but were not each compile-checked against the FE — treat code blocks as high-fidelity proposals and run `yarn typecheck`/`yarn lint` after each. "Verify before you cite" (step 2) is required, especially for generated schema key names.
