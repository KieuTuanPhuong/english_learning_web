# Feature 2 — Scoring Matrix (Rubrics): Frontend Implementation

Frontend companion to the full-stack research doc:
`english-learning-api/docs/research/02-scoring-rubrics.md` (referred to as
**doc 1** below). All API shapes, aggregation rules, seed content and
permission semantics are defined there — this doc does not restate them.

---

## 1. Overview & Goals

The teacher grading screen
(`app/(app)/submissions/[id]/page.tsx: TeacherGradingScreen`) currently offers
one numeric `TextField` (0–100) and one `TextArea`. This feature replaces that
with a **rubric matrix** when the submission's exercise resolves to a rubric
template: criteria as rows, bands as columns, clickable cells, band
descriptors on hover/expand, an auto-computed overall, free-text comments
below, and — for speaking submissions — the audio player on the same screen
(it is already there today via `<audio controls>`). Students get a read-only
criterion breakdown inside their existing feedback cards.

**Success criteria (frontend)**
- Grade a 4-criterion submission in ≤6 interactions; descriptors readable
  without leaving the page.
- The overall preview always matches the server's authoritative value (doc 1
  §4.3: client `score` is ignored when `criterion_scores` are sent — the
  preview is display-only by construction).
- No rubric resolved → the screen renders exactly today's holistic form; zero
  regression for quiz/reading/listening review.
- Matrix is keyboard-accessible (each criterion row is a radiogroup).

---

## 2. Requirements Breakdown

### Functional
- **FR1** Fetch the resolved rubric per exercise
  (`GET /api/exercises/{id}/rubric/`, nullable — doc 1 §4.2) and render the
  matrix only when non-null **and** the submission is writing/speaking.
- **FR2** Cell click selects exactly one band per criterion; re-click of the
  same cell deselects (allows abandoning rubric mode for holistic entry).
- **FR3** Hover (desktop) or tap-expand (mobile) shows the full band
  descriptor; a "show descriptors" toggle expands all cells inline for
  teachers who prefer reading the whole matrix.
- **FR4** Overall preview updates live: native band (e.g. "6.5") leading,
  normalized `/100` secondary; submit disabled until all criteria are scored
  (all-or-nothing, doc 1 FR4) unless the teacher switches to holistic mode.
- **FR5** Free-text comments remain required (existing form rule); optional
  per-criterion `note` behind a small expand affordance per row.
- **FR6** Speaking submissions show the `<audio controls>` player (existing
  left-column markup) on the same screen as the matrix so listening and
  scoring share one viewport.
- **FR7** Student read view: criterion chips + bands inside each feedback
  card in `StudentSubmissionDetail`, expandable to descriptor text; works for
  AI feedback rows identically (`is_ai_generated` already themes the card).
- **FR8** 1×N templates (TOEIC proficiency, doc 1 §3.1) render as a single
  level-picker row, not a degenerate table.

### Non-functional
- **NFR1** No new runtime dependencies (see §3) — matches the repo's small
  dependency budget (doc 03's frontend, by contrast, justifies two tiny
  packages; this feature needs none).
- **NFR2** Types come from the regenerated OpenAPI schema
  (`yarn gen:api` → `lib/types/api.d.ts`); no hand-written DTOs.
- **NFR3** The client-side aggregation preview is one pure function mirroring
  doc 1 §4.1 `aggregate()`/`normalize()`, unit-tested against the same table
  cases (6,6,7,7 → 6.5 etc.).
- **NFR4** Matrix renders comfortably at 4 criteria × 10 bands on a laptop
  and degrades to a stacked per-criterion layout under `sm:`.

---

## 3. Tools & Technology Choice (frontend-specific)

The stack is React 19.2 / Next 16 App Router / TypeScript strict /
Tailwind 4 / TanStack Query 5 / react-hook-form + zod 4, with a self-owned UI
kit (`components/ui.tsx` — no Radix/shadcn). Choices below are scoped to what
this feature actually adds. (Note `AGENTS.md`: this Next.js version has
breaking changes — check `node_modules/next/dist/docs/` before coding; nothing
in this feature needs new Next APIs, it is all client components under the
existing route.)

| Concern | Candidates | Verdict |
|---|---|---|
| **Matrix grid** | Custom CSS grid/table (recommended) · TanStack Table v8 · AG Grid Community | **Custom.** The matrix is a *fixed-shape input control* (≤6 rows × ≤10 columns, radio semantics per row), not a data grid: no sorting, filtering, virtualization or column state. TanStack Table is headless-but-substantial machinery for tabular *data display*; AG Grid is a heavyweight enterprise grid (and its selection model fights radio semantics). A `<table>` + Tailwind + `role="radiogroup"` rows is smaller than either integration. Precedent: `components/quiz/McqOptions.tsx` already implements clickable-option semantics by hand. |
| **Band-descriptor popover** | Custom hover/expand (recommended) · @radix-ui/react-tooltip · Floating UI | **Custom.** The repo's UI kit is dependency-free (`components/ui.tsx` exports `Modal`, `Tabs`, etc. hand-rolled). Descriptors are long paragraphs — tooltips are the wrong control anyway; we want *expand-in-place* (accordion cell / a details panel under the matrix) with `title`-style hover as a bonus. Radix tooltip would be the first Radix dependency for a control we would immediately outgrow. Floating UI is justified only if we later need collision-aware positioning. |
| **Audio player (speaking)** | Native `<audio controls>` (recommended, already in use) · wavesurfer.js · react-h5-audio-player | **Native for MVP.** `app/(app)/submissions/[id]/page.tsx` already renders `<audio controls src={submission.audio_recording_url}>` — and `audio_recording_url` is a mock string until the platform gets real file storage (doc 1 §7 risk 4), so waveform seeking has nothing real to seek. wavesurfer.js (waveform + regions, useful for "replay the sentence I'm scoring") is the named Phase 3 upgrade once real audio exists; react-h5-audio-player adds styling but no capability. |
| **Score-form state** | react-hook-form + zod (recommended, existing) · local useState | **react-hook-form + zod.** Cell selections live in RHF form state via `setValue`/`watch` (`scores.<criterionId>`), so dirty tracking and submit flow stay uniform with the existing grade form's plain `useForm` (no resolver exists in the app today — same finding as doc 04 FE §3.3). The zod 4 `superRefine` schema (§4.4) validates in the submit handler via `safeParse`; switch to `zodResolver` only if doc 03's `@hookform/resolvers` addition has already landed. |
| **Charts for per-skill trends** | Deferred (Phase 3, analytics) | Out of scope here; decide when doc 1 §5 step 13's endpoint exists. |

**Summary:** zero new packages for MVP. Everything rides on primitives the
codebase already uses.

---

## 4. Design

### 4.1 Route map

No new routes — the feature lives inside existing screens:

| Route | Change |
|---|---|
| `app/(app)/submissions/[id]/page.tsx` | Teacher: rubric matrix replaces the score `TextField` when a rubric resolves (holistic fallback preserved). Student: criterion breakdown inside feedback cards. |
| `app/(app)/exercises/[id]/page.tsx` | Optional badge "Rubric: IELTS Writing Task 2" so students see the marking scheme before submitting (Phase 2 polish). |
| Exercise authoring | No authoring UI exists today (`lib/api.ts: createExercise` has no consuming form in `app/`). The rubric *picker* therefore has no home yet; the per-type default fallback (doc 1 FR3) makes the matrix work regardless. When an authoring form lands, add a `<select>` of `useRubrics()` filtered by `exercise_type`. |

### 4.2 Component tree

New directory `components/rubric/`:

```
TeacherGradingScreen (existing, app/(app)/submissions/[id]/page.tsx)
└── RubricGradeForm                      // replaces score TextField when rubric != null
    ├── RubricMatrix                     // <table>, criteria rows × band columns
    │   └── CriterionRow (× per criterion)   // role="radiogroup", arrow-key nav
    │       └── BandCell (× per band)        // role="radio", aria-checked, hover title
    ├── BandDescriptorPanel              // expands the focused/hovered cell's full text
    ├── CriterionNoteField (× per row, collapsed)  // optional per-criterion note
    ├── OverallScorePreview              // native band + normalized /100, "computed" label
    ├── TextArea (existing ui.tsx)       // comments — unchanged requirement
    └── Button (existing ui.tsx)         // submit

StudentSubmissionDetail (existing, same file)
└── FeedbackCard (existing markup)
    └── RubricBreakdown                  // read-only chips: criterion → band, expandable
        └── uses qk.rubric(templateId) for descriptor wording

components/rubric/aggregate.ts           // pure fns: aggregate(), normalize() — mirrors doc 1 §4.1
components/rubric/schemas.ts             // zod schemas (§4.4)
```

`RubricGradeForm` receives `submission`, `template` (from
`useExerciseRubric`), and calls the existing `useCreateFeedback()` mutation.
`RubricBreakdown` receives a `Feedback` row (which embeds `criterion_scores`
and `rubric_template_id` after `yarn gen:api`) and lazily fetches the template
for names/descriptors.

### 4.3 Data fetching (TanStack Query)

`lib/query-keys.ts` additions (same factory style):

```ts
rubrics: ["rubrics"] as const,
rubric: (id: number) => ["rubrics", id] as const,
exerciseRubric: (exerciseId: number) => ["exercises", exerciseId, "rubric"] as const,
```

`lib/api.ts` additions (typed against regenerated `lib/types/api.d.ts`):

```ts
export function listRubrics(): Promise<RubricTemplate[]> {
  return apiFetch<RubricTemplate[]>("/api/rubrics/");
}
export function getRubric(id: number): Promise<RubricTemplate> {
  return apiFetch<RubricTemplate>(`/api/rubrics/${id}/`);
}
// 200 with null body when no rubric resolves (doc 1 §4.2).
export function getExerciseRubric(exerciseId: number): Promise<RubricTemplate | null> {
  return apiFetch<RubricTemplate | null>(`/api/exercises/${exerciseId}/rubric/`);
}
```

`lib/hooks.ts` additions:

```ts
export function useRubrics() {
  return useQuery({ queryKey: qk.rubrics, queryFn: api.listRubrics,
                    staleTime: 5 * 60_000 });   // templates change ~never
}
export function useRubric(id: number | undefined) {
  return useQuery({
    queryKey: qk.rubric(id ?? NaN),
    queryFn: () => api.getRubric(id!),
    enabled: id != null && Number.isFinite(id),
    staleTime: 5 * 60_000,
  });
}
export function useExerciseRubric(exerciseId: number) {
  return useQuery({
    queryKey: qk.exerciseRubric(exerciseId),
    queryFn: () => api.getExerciseRubric(exerciseId),
    enabled: Number.isFinite(exerciseId),
  });
}
```

Mutation: **`useCreateFeedback()` is reused unchanged** — after `yarn
gen:api`, `FeedbackRequest` widens to accept optional `criterion_scores`, so
the call site just sends a bigger body. Its existing invalidation of
`qk.submissionFeedback(submission_id)` already refreshes the review screen;
add `qk.submissionsInbox()` invalidation (status flips to `graded`), matching
what `useAiEvaluate` does today.

### 4.4 zod schemas (`components/rubric/schemas.ts`)

Validation is template-driven, so the schema is built from the fetched
template (zod 4):

```ts
import { z } from "zod";

export function buildCriterionScoreSchema(t: RubricTemplate) {
  const min = Number(t.scale_min), max = Number(t.scale_max),
        step = Number(t.score_step);
  return z.object({
    criterion_id: z.number().int(),
    score: z.number().min(min).max(max)
      // integer-math step check — avoids float modulo (works for step 0.5 or 1)
      .refine((v) => Math.round((v - min) * 10) % Math.round(step * 10) === 0,
        { message: `Score must be in steps of ${step}` }),
    note: z.string().max(2000).optional(),
  });
}

export function buildGradeFormSchema(t: RubricTemplate) {
  return z.object({
    criterion_scores: z.array(buildCriterionScoreSchema(t))
      .superRefine((rows, ctx) => {
        const expected = new Set(t.criteria.map((c) => c.id));
        const got = new Set(rows.map((r) => r.criterion_id));
        if (expected.size !== got.size || [...expected].some((id) => !got.has(id))) {
          ctx.addIssue({ code: "custom",
            message: "Score every criterion before submitting." });
        }
      }),
    comments: z.string().min(1, "Comments are required"),
  });
}
```

DRF decimals arrive as strings in the OpenAPI types; convert at the form
boundary (`Number(...)` in, `.toFixed(1)` out) — same handling as
`formatScore` elsewhere.

`components/rubric/aggregate.ts` (preview only — server value is
authoritative, doc 1 NFR3):

```ts
export function aggregatePreview(t: RubricTemplate, values: number[]): number {
  if (t.aggregation === "sum") return values.reduce((a, b) => a + b, 0);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (t.aggregation === "mean_down_half") return Math.floor(mean * 2) / 2;
  if (t.aggregation === "mean_nearest_half") return Math.round(mean * 2) / 2;
  return Math.round(mean * 100) / 100;
}
export function normalizePreview(t: RubricTemplate, overall: number): number {
  const min = Number(t.scale_min), max = Number(t.scale_max);
  return Math.round(((overall - min) / (max - min)) * 10000) / 100;
}
```

Unit-test both against doc 1 §5 step 7's table cases so client and server can
never silently diverge.

### 4.5 UX flows

**Teacher grades a speaking submission**
1. Opens `/submissions/{id}` from the inbox. Left column: prompt +
   `<audio controls>` player (existing). Right column: `useExerciseRubric`
   resolves "IELTS Speaking" → `RubricGradeForm` renders instead of the score
   field.
2. Matrix shows 4 rows (Fluency & Coherence … Pronunciation) × bands 0–9.
   Hovering a cell shows a truncated descriptor via the panel below the
   matrix; clicking selects (cell fills teal, `aria-checked`).
3. After the 4th selection, `OverallScorePreview` shows "Band 6.5 · 72/100
   (computed)"; submit enables once comments are filled.
4. Submit → `useCreateFeedback` with `criterion_scores` (no `score` field —
   server computes) → invalidations → router back to `/submissions` (existing
   behavior).
5. Fallback link "Grade without rubric" swaps back to the holistic
   score+comments form at any point.

**Student reads the result**
1. `/submissions/{id}` feedback card shows the existing score badge
   (normalized, unchanged) plus `RubricBreakdown`: one chip per criterion
   ("Pronunciation — Band 6"). Tapping a chip expands the official descriptor
   for that band — the student sees exactly what Band 6 pronunciation means.
2. AI feedback rows (`accent`-themed cards with the violet `AiTag`) render the
   identical breakdown when Phase 3 lands — no new component.

**No rubric resolves** — `useExerciseRubric` returns `null`: the page is
pixel-identical to today.

**Accessibility**: rows are `role="radiogroup"` labelled by criterion name;
cells `role="radio"` with arrow-key navigation and `aria-describedby` to the
descriptor panel; the expand-all toggle serves screen-reader users a full
static matrix; color selection is paired with a check icon (not color-only).

---

## 5. Implementation Guidelines

**Phase 1 — MVP (after backend doc 1 §5 Phase 1 merges)**
1. `yarn gen:api` against the updated `/api/schema/`; verify
   `RubricTemplate`, `criterion_scores` on `Feedback`/`FeedbackRequest`, and
   the nullable exercise-rubric response landed as real types (doc 1 §7 risk
   8), not `unknown`.
2. `lib/query-keys.ts`, `lib/api.ts`, `lib/hooks.ts`: additions per §4.3.
3. `components/rubric/aggregate.ts` + `schemas.ts` with unit tests.
4. `components/rubric/RubricMatrix.tsx`, `BandCell.tsx`,
   `BandDescriptorPanel.tsx`, `OverallScorePreview.tsx`,
   `RubricGradeForm.tsx` — Tailwind only, reusing `Card`/`Badge`/`Button`/
   `TextArea` from `components/ui.tsx`.
5. Wire into `TeacherGradingScreen`
   (`app/(app)/submissions/[id]/page.tsx`): render `RubricGradeForm` when
   `useExerciseRubric(submission.exercise_id).data` is non-null and
   `submission_type` is writing/speaking; keep the holistic form as the
   fallback branch and the "Grade without rubric" escape hatch.
6. `RubricBreakdown.tsx` into `StudentSubmissionDetail`'s feedback card loop
   (guard: render only when `fb.criterion_scores?.length`).
7. Manual pass: writing + speaking + quiz submissions, teacher and student
   roles, no-rubric exercise regression.

**Phase 2 — Polish & authoring**
8. Rubric badge on `app/(app)/exercises/[id]/page.tsx` (uses
   `useExerciseRubric`; students see the marking scheme up front).
9. Per-criterion `note` fields (collapsed by default) + display in
   `RubricBreakdown`.
10. Rubric picker `<select>` wherever the exercise-authoring form lands;
    `useRubrics()` filtered by the chosen `exercise_type`.
11. Mobile stacked layout for the matrix (`sm:` breakpoint: one criterion
    card at a time with a horizontal band strip).

**Phase 3 — With platform upgrades**
12. AI matrices appear automatically once backend Phase 3 ships (same
    components); add a side-by-side "AI vs teacher" criterion comparison on
    the teacher screen.
13. wavesurfer.js waveform player when real audio storage replaces mock
    `audio_recording_url` strings.
14. Per-skill trend chart on the student dashboard once the analytics
    endpoint (doc 1 §5 step 13) exists.

---

## 6. Integration with Existing Code

**Reused**
- `app/(app)/submissions/[id]/page.tsx` — both role branches extended in
  place; the left-column response/audio rendering is untouched.
- `useCreateFeedback` (`lib/hooks.ts`) — same mutation, wider body; existing
  invalidation of `qk.submissionFeedback` plus inbox invalidation.
- `useExercise`, `useSubmissionFeedback`, `useSubmissionsInbox` — unchanged;
  the matrix only *adds* `useExerciseRubric`.
- `components/ui.tsx` kit (`Card`, `Badge`, `Button`, `TextArea`, `AiTag`,
  `Skeleton`) and the zinc/teal/violet Tailwind palette; `formatScore`
  (`lib/format.ts`) keeps rendering the normalized score everywhere else.
- `lib/api.ts` `apiFetch` (auth/refresh/error normalization) and the
  openapi-typescript pipeline (`yarn gen:api`) — no hand-written DTOs.
- Realtime: the existing `feedback_posted` broadcast + `useRealtimeNotifications`
  invalidation (`qk.mySubmissions`, dashboard, inbox) already refreshes the
  student's lists when a matrix grade lands — nothing new needed.

**Deliberately NOT reused**
- `components/quiz/*` (`QuestionCard`, `McqOptions`, `TrueFalse`,
  `FillBlankInput`, `ShortAnswer`, `AnswersReview`): they render question/option
  answer-key structures with correct/incorrect semantics. Bands are
  descriptive levels, not answers; forcing `McqOptions` to render bands would
  entangle two unrelated domains. Only the *interaction pattern* (clickable
  option, selected state) is imitated.
- The existing score `TextField` for rubric mode: a free numeric field beside
  a matrix invites contradictory input; the server ignores client `score`
  when criterion scores are present (doc 1 §4.3), so the UI removes it rather
  than displaying a lie.
- TanStack Table / any grid library — §3.
- `components/annotations/*` (doc 03's frontend): independent feature; both
  mount on the same page but share no components. Coordinate only on
  right-column layout order (annotations sidebar vs rubric form) when both
  are merged.

---

## 7. Risks & Open Questions

| # | Risk / question | Mitigation |
|---|---|---|
| 1 | 10-band matrices (0–9) are wide; descriptors are paragraphs. | Cells show only the band number; wording lives in the hover/expand panel (§4.2). Stacked layout under `sm:`. If still cramped, collapse bands 0–3 ("below 4") behind an expander — data unchanged. |
| 2 | Client preview drifts from server aggregation (e.g. float vs Decimal edge). | Preview is labelled "computed"; authoritative value returns in the mutation response and replaces the preview on success. Shared table tests (§4.4) pin both implementations. |
| 3 | Teacher fills the matrix, then submits while a criterion is missing (fast clicking / stale state). | zod `superRefine` complete-set check blocks submit client-side; server 400 (doc 1 §4.3 validation 3) is surfaced via the existing `ApiError` → `formError` pattern already in `TeacherGradingScreen`. |
| 4 | `StudentSubmissionDetail` finds the submission via `useMySubmissions().data?.find(...)` — that cached list (e.g. `status`) could go stale relative to the new breakdown. | Breakdown reads from `useSubmissionFeedback(id)` (fresh, already invalidated by mutations), not from the submissions list. No change to the list flow. |
| 5 | Where should the annotations sidebar (doc 03) and the rubric form sit when both ship? | Open question for a small design pass: proposal — left column keeps text+annotations (inline pass), right column stacks rubric matrix above comments (overall pass). Raised in both docs so whichever merges second resolves it. |
| 6 | Next 16 breaking changes (per `AGENTS.md`) could invalidate assumptions in older examples. | Feature uses only client components, existing routing and TanStack Query — no new Next APIs. Still: read `node_modules/next/dist/docs/` notes before Phase 1 coding, as the repo mandates. |
| 7 | Decimal-as-string OpenAPI types leaking `string` scores into arithmetic. | Convert once at the form/preview boundary (§4.4); TypeScript strict mode makes accidental string math a compile error. |
