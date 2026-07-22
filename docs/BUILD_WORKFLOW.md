# English Learning Web — Build Workflow

> How to actually build what [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) describes: ordered phases,
> what parallelizes, dependencies, and the verification gate that closes each milestone.

---

## 0. Ground rules (every task)

1. **Read the Next 16 doc first.** Per [AGENTS.md](../AGENTS.md), before writing a page/layout/route/hook,
   read the matching guide in `node_modules/next/dist/docs/`. This Next has breaking changes (async `params`,
   Turbopack default, `use client` rules, Tailwind v4, `NEXT_PUBLIC_` inlining).
2. **Types come from the API, not your head.** Regenerate `lib/types/api.d.ts` from `/api/schema/` and import
   those types. Never hand-type a response shape you can generate.
3. **Every data screen ships 4 states:** loading (skeleton) · empty · error · populated. The wireframes already
   spec these — don't skip them.
4. **Verify against the live API, not mocks.** Backend runs at `127.0.0.1:8000`; a screen isn't done until its
   real request returns and renders.
5. **Branch per milestone**, conventional commits, PR with the milestone gate checklist. Commit/push only when asked.

---

## 1. Phase DAG

```
M0 Foundation ──────────────► M1 Student ──┐
   (shell, auth, client,                   ├──► (M3 Admin, deferred)
    types, design system)   ► M2 Teacher ──┘
```
- **M0 blocks everything.** Nothing real renders until the client + auth + shell exist.
- **M1 and M2 can run in parallel after M0** (different shells, mostly different routes) but share the design
  system and API hooks — build those once in M0. Recommended: M1 first to prove the data layer on the simpler
  mobile flow, then M2.

---

## 2. M0 — Foundation (sequential spine, then fan-out)

**Order matters here — later steps import earlier ones.**

1. **Resolve the §9 verification checklist.** Hit the live API for the high-impact unknowns *before* writing the
   client: pagination shape, submission-create path, feedback-create path, list scoping. Cheapest bug to fix now.
2. **Add deps:** `@tanstack/react-query`, `openapi-typescript` (dev), `react-hook-form` `zod`, `lucide-react`,
   `date-fns`. (`yarn` — lockfile present.)
3. **Env:** `.env.local` → `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`. Add `.env.example`. Read as a literal
   `process.env.NEXT_PUBLIC_API_URL`.
4. **Generate types:** `npx openapi-typescript http://127.0.0.1:8000/api/schema/ -o lib/types/api.d.ts`.
   Add a `yarn gen:api` script; document re-running it when the backend changes.
5. **API client** (`lib/api/client.ts`): base URL, `Authorization` header injection, JSON parse, error
   normalization (`{detail}` vs `{field:[msgs]}`), **single 401→refresh→retry interceptor**.
6. **Auth** (`lib/api/auth.ts` + `lib/auth/`): `login`/`register`/`refresh`/`logout`, the `access_token`↔`refresh`
   field normalizer, token storage, `AuthProvider` (`{user, role, login, register, logout, isLoading}`), boot-time
   refresh→`/users/me/`.
7. **Providers** (`app/providers.tsx`, `'use client'`): `QueryClientProvider` + `AuthProvider` +
   `RoleThemeProvider`; mount in `app/layout.tsx`.
8. **Design tokens** in `app/globals.css` `@theme`: role accents + badge palette (§7 of the plan).
9. **— fan-out (parallel) —**
   - **Design-system primitives** (`components/ui/*`): Button, Card, Badge, Field, Avatar, Tabs, ProgressBar,
     Skeleton, Modal, Toast — ported from [primitives.jsx](../design/wireframes/primitives.jsx), polished.
   - **App shells** (`components/layout/*`): `MobileShell` (top bar + bottom tab bar), `DesktopShell`
     (top bar + sidebar), `RoleTheme` (`data-role` accent swap), `nav`.
   - **Resource hooks scaffolding** (`lib/hooks/*`, `lib/api/endpoints/*`): query-key factory + typed endpoint
     fns + base hooks (`useMe`, `useClasses`, `useModules`, `useSubmissions`, …).
10. **Routing skeleton:** `(auth)` + `(app)` route groups, `(app)/layout.tsx` guard, `app/page.tsx` redirect.

**M0 gate:** `next build` green · lint clean · a real `login` against `127.0.0.1:8000` succeeds, `GET /users/me/`
returns, and the shell renders with the correct role accent + nav. Then it's safe to fan out screens.

---

## 3. M1 — Student flow

Screens are independent once M0 exists → **build in parallel, one task per screen**, but land the **J1 critical
path first** end-to-end to flush out integration bugs early:

**J1 spine (do first, in order):** S1 Login → S5 Dashboard → S10 Exercise Viewer (writing) → submit → S5 reflects ✓.

**Then parallel:** S2 Register · S3 Profile · S4 Logout · S6 My Classes · S7 Class Detail · S8 Module Catalog ·
S9 Module Detail · S10v Speaking · S11 My Submissions · S12 Submission Detail.

Per-screen task = page route + composite component + the hook(s) from the plan's §5 mapping + 4 states + wire nav.

Watch-outs (from analysis):
- **Dashboard "due soon" is client-assembled** — fan out `GET /classes/` → `GET /classes/{id}/assignments/`,
  merge + sort by due date. There is no single endpoint.
- **"Save draft" is local** (no draft endpoint). Persist to `localStorage` keyed by exercise id; clear on submit.
- **Exercise type drives the viewer** (`writing`→single column, `speaking`→split + audio-URL paste).
- **Decimals are strings** — format `score`/`completion_percentage` for display.

**M1 gate:** J1 passes end-to-end on the live API · all 12 screens have loading/empty/error/populated ·
mobile-responsive · tab bar hidden on focus screens · `next build` + lint green.

---

## 4. M2 — Teacher flow

**J3 + J4 spines first**, then parallelize the rest.

**J3 spine:** T19 My Modules → T20 Module Editor (create) → T21 Exercises (add) → T15 Class Detail →
T22 Assignment Creator (assign).
**J4 spine:** T13 Dashboard (ungraded count) → T23 Inbox (filter ungraded) → T24 Grading (score+comment,
**Save & next** loop).

**Then parallel:** T14 My Classes · T16 Create/Edit Class · T17 Enroll Students · T18 Lesson Plan Editor.

Watch-outs:
- **Dashboard KPIs are derived** — no stats endpoint. Count from `classes`/`submissions(status=ungraded)`/`modules`.
- **Grading mutation** posts feedback (confirm `/feedback/` vs nested path), then **invalidates** the submissions
  query so the inbox count drops; "Save & next" advances the local queue cursor + prefetches the next.
- **Enroll** = search `GET /users/` (role=student) → stage → `POST /classes/{id}/students/`; mark already-enrolled
  by diffing against `GET /classes/{id}/students/`.
- **Archive ≠ delete** — `PATCH` a status field, not `DELETE /classes/{id}/`.
- Use **optimistic updates** for grading and enroll to keep the desktop workflow snappy.

**M2 gate:** J3 + J4 pass end-to-end · grading loop verified across a multi-item queue · all 12 screens 4-state ·
desktop layouts (sidebar nav) · build + lint green.

---

## 5. M3 — Admin (deferred)

Reuse `DesktopShell` with amber accent + sidebar `Dashboard·Users·Classes·Modules·Logs`. Screens 25–29 +
journey **J6** (search user → user detail → set `status: suspended` → PATCH `/users/{id}/`). Confirm admin-only
authz (§9 #5) before exposing.

---

## 6. Verification gates (how to actually check)

| Level | Tool | When |
|---|---|---|
| Build | `yarn build` (Turbopack) — must be green | every task before PR |
| Lint/types | `yarn lint` + `tsc --noEmit` | every task |
| Manual journey | the **`/run`** + **`/verify`** skills — launch the app, walk J1/J3/J4 against the live backend | each milestone gate |
| E2E (optional) | Playwright (MCP available) — script J1/J3/J4 as regression tests | once a journey is stable |
| Review | **`/code-review`** on the diff; `typescript-reviewer` agent for the API/auth client | each PR |

A milestone is **done** only when its journey(s) run green against `127.0.0.1:8000`, not when the screens merely
render.

---

## 7. Optional: parallel agent execution (ultracode)

If you want to fan this out across agents rather than build by hand, the natural decomposition:

- **M0 is the serial bottleneck** — one agent (or you) builds the client/auth/shell/types spine. Do **not**
  parallelize M0; everything depends on its exact shapes.
- **After M0, screens are embarrassingly parallel.** Fan out one agent per screen with a shared brief: the screen's
  §5 row (endpoints + states), the design-system component list, and the relevant wireframe file
  ([student.jsx](../design/wireframes/student.jsx) / [teacher.jsx](../design/wireframes/teacher.jsx)). Use
  `isolation: "worktree"` so parallel file writes don't collide, then integrate + run the journey gate.
- **Verify adversarially:** after each screen, a reviewer agent checks it against the wireframe + contract (right
  endpoint? all 4 states? decimals-as-strings? role-guarded?). Confirmed issues feed the next round.
- Pin the journey gate as the final, non-parallel integration step per milestone.

---

## 8. First concrete steps (when you say "go")

1. Run the §9 checklist probes against the live API; record answers in the plan.
2. M0 step 2–4: add deps, `.env.local`, generate `lib/types/api.d.ts`.
3. Build the auth + API client spine; prove `login` + `GET /users/me/`.
4. Primitives + shells + role theme.
5. Land J1's spine. Then fan out.
