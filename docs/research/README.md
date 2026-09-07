# Research Docs — Index (Frontend)

Four frontend research docs, each the companion of an API doc in
`english-learning-api/docs/research/` (which owns contracts, models, and
endpoint paths — the frontend docs never restate them). This index summarizes
each doc and consolidates the shared frontend concerns. Cross-doc references
use the short names "doc 01" … "doc 04".

---

## Doc index

### [01 — Mock Tests: Frontend Implementation](01-mock-tests-frontend.md)

The student-facing mock-test surface: a catalog of published templates with a
resume banner, a distraction-free full-screen runner in its own `(test)` route
group (no AppShell, no notification websocket), and a score report with
partial states. Core mechanics: `useServerCountdown` (server-offset countdown
from `expires_at` + `server_time`), debounced single-envelope autosave via
`use-debounce` (flush on submit/tab-hide, 409 `section_expired` as a state
transition), server-draft-only resume (no localStorage), play-once listening
audio (`PlayOnceAudio`, native `<audio>`), and unmodified reuse of
`components/quiz/*` + `lib/exercises.ts` against the answer-blind runner
payload. One new dependency: `use-debounce`.

### [02 — Scoring Matrix (Rubrics): Frontend Implementation](02-scoring-rubrics-frontend.md)

Replaces the teacher's single 0–100 score field with a clickable
criteria×bands `RubricMatrix` (custom `<table>` + radiogroup semantics — no
grid library) on `app/(app)/submissions/[id]/page.tsx`, with band-descriptor
expand panels, a client-side aggregation preview mirroring the server rule
(display-only; server value authoritative), holistic-form fallback, and a
read-only `RubricBreakdown` in student feedback cards. Rides the existing
`useCreateFeedback` mutation with a wider body. Zero new packages; new
`components/rubric/*` only. Coordinates right-column layout with doc 03
(risk 5 there, risk 8 here — annotations sidebar above matrix + comments).

### [03 — Inline Writing Annotations: Frontend Implementation](03-writing-annotations-frontend.md)

Turns the `writing_text` paragraph on the submission review page into an
annotatable surface: selection capture via TreeWalker (UTF-16 → code-point
conversion in pure `lib/annotations.ts` functions), segment-splitting overlap
renderer (interactive `<mark>`-style spans, "+N" cap), Floating UI popover
editor (category / comment / suggested correction), and a synced sidebar —
one renderer for teacher (interactive) and student (read-only) views. Adds
`@floating-ui/react` and `@hookform/resolvers` (zod's first form-resolver
use). The server's `quoted_text` integrity check turns any offset drift into
a 400, never silent anchor corruption.

### [04 — Pronunciation Practice (Frontend Research)](04-pronunciation-practice-frontend.md)

A practice hub (`/pronunciation`) and drill player
(`/pronunciation/[drillId]`) delivering the record → score → retry loop:
`useRecorder()` (`lib/use-recorder.ts` — native `MediaRecorder`, explicit
permission state machine, 30 s cap, Blob + object URL), a hand-rolled
`AnalyserNode` canvas level meter, multipart upload (requires the one-line
`buildRequest` FormData fix in `lib/api.ts`), and color-coded word/phoneme
feedback zod-validated at the `word_results` JSONField boundary
(`z.coerce.number()` for DRF decimal strings, soft-fail breakdown). Teacher
drill CRUD via the existing `Modal` pattern. No new dependencies.

---

## Shared Frontend Concerns

### 1. Shared audio recorder + audio player components

Speaking (mock tests), pronunciation, and listening all touch audio; the
docs converge on one set of primitives:

- **Recorder — one hook:** `useRecorder()` in `lib/use-recorder.ts`, specified
  in doc 04 §4.3 (permission/lifecycle state machine, `isTypeSupported` mime
  chain, `AnalyserNode` exposure, resource cleanup). Consumers: doc 04's
  `RecorderPanel` and doc 01's `SpeakingTaskPane` (Phase F4). Build it once,
  to that spec, in whichever feature lands first. The base64 inline recorder
  in `app/(app)/exercises/[id]/page.tsx` is superseded and migrates in a
  follow-up. Contract difference lives only at submit time: pronunciation
  uploads the raw Blob as `FormData`; mock-test speaking converts the Blob to
  a data-URL string until the shared storage work (API doc 04 §3.3) lands.
- **Players — native `<audio>` everywhere, wrapped where behavior differs:**
  plain `<audio controls>` for review playback (doc 02) and attempt replay
  (doc 04); `PlayOnceAudio` (doc 01) is a play-once wrapper over the native
  element (custom button, no seek, `onended` → persisted played flag). No
  player library at MVP; **wavesurfer.js is the single named Phase-3
  upgrade** for both docs 02 and 04, gated on real audio storage.
- **Level metering:** hand-rolled canvas + `AnalyserNode` (doc 04), reusable
  by any future recording UI.

### 2. Test-runner timer patterns (doc 01)

- No timer library: `useServerCountdown(expiresAt, serverTime)` computes a
  clock offset once per attempt fetch (`offset = parse(server_time) −
  Date.now()`), ticks at 500 ms, and exposes phases
  (`normal/warning/critical/expired`). The client clock is never trusted.
- Autosave and timer interlock: on `expired`, pending autosave is cancelled
  (it would 409) and the locked `TimeUpDialog` renders; a `409
  section_expired` from autosave triggers the same transition.
- Recommended backend add: echo `server_time` on autosave responses so long
  sections re-sync the offset every write (doc 01 risk 5).
- Pattern is reusable for any future server-deadline UI (e.g. timed quizzes).

### 3. Review-screen composition (docs 02 + 03 on `submissions/[id]`)

- Both features mount on `app/(app)/submissions/[id]/page.tsx` with **no
  shared components** (`components/rubric/*` vs `components/annotations/*`)
  and independent query keys — mergeable in either order.
- Agreed layout proposal (doc 02 risk 5 = doc 03 risk 8): **left column**
  keeps the student text with inline annotation highlights (inline pass);
  **right column** stacks the annotation sidebar above the rubric matrix +
  comments (overall pass). A small design pass by whichever feature merges
  second finalizes it.
- Both read through the feedback audience (`can_view_submission_feedback` on
  the API side); student views reuse the same renderers read-only, so teacher
  and student can never diverge.
- Realtime: the existing `feedback_posted` invalidation already refreshes
  lists after a matrix grade; `annotation_posted` (doc 03 Phase 2) and
  `qk.testAttemptReport` invalidation (doc 01 Phase F6) extend the same
  `useRealtimeNotifications` switch — one websocket handler, additive cases.

### 4. API type regen workflow

Identical for all four features — it is the contract-sync ritual:

1. Backend phase merges and runs locally → **`yarn gen:api`** regenerates
   `lib/types/api.d.ts` from `/api/schema/` (drf-spectacular). Never
   hand-edit `api.d.ts`.
2. Add friendly aliases in `lib/types/index.ts` (verify generated names —
   e.g. enums may come out as `CategoryEnum`); `yarn typecheck`.
3. Extend `lib/query-keys.ts` (factory style), `lib/api.ts` (via `apiFetch` —
   one function per consumed endpoint), `lib/hooks.ts` (query/mutation
   conventions, explicit invalidation lists).
4. **Runtime boundaries get zod:** every `JSONField`-shaped `unknown`
   (`draft_answers` doc 01, `word_results` doc 04) and every form schema is
   zod-validated; parse failures degrade gracefully, never crash. DRF
   decimals arrive as strings — coerce once at the boundary
   (`z.coerce.number()` / `Number(...)`), never in components.
5. Verify nullable/nested responses generated real types, not `unknown`
   (doc 02 risk 8) — `@extend_schema` gaps are backend bugs to file.

### 5. Dependency budget (cross-feature ledger)

- doc 01: `use-debounce` (autosave flush/maxWait is load-bearing).
- doc 02: none.
- doc 03: `@floating-ui/react` (selection-anchored popover),
  `@hookform/resolvers` (first zod resolver).
- doc 04: none — but its `safeParse` drill-form plan exists only because
  `@hookform/resolvers` is absent; once doc 03 lands, `zodResolver` becomes
  available to docs 02/04 forms as well.

### 6. Suggested build order (mirrors the API index)

**03 annotations → 02 rubrics → 04 pronunciation → 01 mock tests.**
03 establishes zod validation + the two small shared packages; 02 completes
the review screen (layout pass with 03) and makes W/S band scores meaningful
for 01; 04 delivers the shared `useRecorder()` hook and (backend Phase 0) the
storage plumbing 01's audio realism needs; 01 is the largest and consumes all
three. The receptive-only slice of 01 (Phases F1–F3, reading sections) has no
audio dependency and can run in parallel. Each frontend phase is gated on its
backend counterpart merging first (`yarn gen:api` is always step 1).
