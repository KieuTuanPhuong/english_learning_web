# Research 01 — Mock Tests: Frontend Implementation

Companion to the API research doc, which owns the contract, data model, and scoring design:
`english-learning-api/docs/research/01-mock-tests.md`. This doc covers only the Next.js web
app. Endpoint paths, field names (`expires_at`, `server_time`, `draft_answers`, the
`section_expired` 409 code, the draft envelope shape) are used exactly as defined there —
do not restate or fork them here.

---

## 1. Overview & Goals

**What.** The student-facing surface for mock tests: a catalog of published templates, a
distraction-free full-screen test runner with a server-synced countdown, question-palette
navigation, play-once listening audio, debounced autosave with resume-after-disconnect, and
a score report that renders partial results (Listening/Reading bands immediately,
Writing/Speaking pending until graded).

**Who.** Students take tests; teachers/admins reach reports through the same report route
(the API enforces owner / class-teacher / admin visibility). Template *authoring* UI is out
of scope for the MVP (teachers can author via API/admin; see §7).

**Success criteria.**
1. A student completes a full multi-section attempt without ever seeing the app navigation,
   another tab of our UI, or an answer key in any network payload.
2. Refresh or network drop mid-section loses at most one debounce window (≤10 s) of answers
   and never grants extra time — remaining time is always derived from `expires_at` +
   `server_time`, never from the client clock.
3. Listening audio cannot be replayed, including after refresh (played state persists in the
   server draft).
4. The runner reuses `components/quiz/QuestionCard` and the `lib/exercises.ts` answer-state
   helpers unmodified.

---

## 2. Requirements Breakdown

### Functional

- **FE1 Catalog** — list published templates (format badge, section count, total duration),
  list my attempts with status; resume banner for an `in_progress` attempt.
- **FE2 Attempt start** — template detail page shows sections/timings/rules; "Start test"
  POSTs the attempt and routes into the runner.
- **FE3 Full-screen runner** — its own route group with a minimal layout: no `AppShell`,
  no notification websocket, just section title, timer, save indicator, and content.
- **FE4 Section flow** — intro screen per section (instructions, duration) → explicit
  "Start section" (this is what starts the server clock) → runner → submit confirmation →
  next section intro or report.
- **FE5 Timer** — countdown from server fields with client-clock offset correction; visual
  warning states at 5 min and 1 min; at zero, inputs lock and a "time's up" dialog offers
  only Submit.
- **FE6 Question palette** — numbered grid across all exercises in the section; states:
  current / answered / unanswered / flagged; click scrolls to the question.
- **FE7 Autosave** — answers, writing drafts, and audio-played flags PATCHed as one draft
  envelope, debounced; pending save flushed before submit and on tab hide; save status
  indicator ("Saved", "Saving…", "Offline — retrying").
- **FE8 Resume** — on runner mount, hydrate answers/writing/audio-played from
  `draft_answers` and recompute remaining time; a section already expired renders the
  locked "time's up" state directly.
- **FE9 Play-once audio** — custom audio control with no seek bar and no replay; `onended`
  records the exercise id into `meta.audio_played` (autosaved); resumed sections with a
  played id show "Audio already played".
- **FE10 Report** — per-section converted scores, raw correct counts where receptive,
  "Pending grading" cards for W/S, overall score once complete, "estimated score"
  disclaimer; polls while partial.
- **FE11 Expiry handling** — a `409 section_expired` from autosave transitions the UI to
  the locked state (no data loss messaging: the server graded from the last accepted draft).

### Non-functional

- **NF1 No answer leakage** — the runner only ever consumes the answer-blind runner
  serializer payload; the frontend must not fetch `/api/exercises/{id}/` (whose serializer
  exposes `is_correct`) from any runner code path.
- **NF2 Input latency** — autosave must not sit on the keystroke path: local React state is
  authoritative during a section; the network write is a debounced side effect.
- **NF3 Type safety** — all new API shapes come from `yarn gen:api` regeneration of
  `lib/types/api.d.ts`; friendly aliases in `lib/types/index.ts`; runtime-`unknown` fields
  (`draft_answers`) validated with zod (already a dependency).
- **NF4 Accessibility** — palette buttons and the timer are keyboard-reachable; timer
  updates use `aria-live="polite"` only at the warning thresholds (not every second).
- **NF5 Honest constraints** — full-screen is a focus aid, not proctoring; we do not
  attempt tab-switch detection or copy-paste blocking in MVP.

---

## 3. Tools & Technology Choice

The API doc settled the big decision (build on existing models, REST + server timestamps).
Three frontend-level choices remain open.

### 3.1 Countdown timer

| Candidate | Pros | Cons |
|---|---|---|
| **Custom `useServerCountdown` hook** | ~30 lines; takes `expires_at` + `server_time`, computes a clock offset once per attempt fetch, ticks with `setInterval`; exactly our semantics | We own the (small) code |
| `react-timer-hook` (npm) | Popular, maintained | Counts down from client `Date.now()`/an expiry `Date`; no notion of a server clock offset — we'd wrap it in the same offset math anyway. https://www.npmjs.com/package/react-timer-hook |
| `react-countdown` (npm) | Declarative renderer | Same client-clock problem; render-prop API adds nothing over a `mm:ss` string we format ourselves |

**Recommendation: custom hook.** The entire value of the timer is the server-offset
correction (`offset = parse(server_time) − Date.now()` captured when the attempt response
lands; `remaining = parse(expires_at) − (Date.now() + offset)`). Libraries do not provide
that, so they would be a dependency plus the same custom code.

### 3.2 Debounced autosave

| Candidate | Pros | Cons |
|---|---|---|
| **`use-debounce`** (v10.x, MIT, ~1 kB) | `useDebouncedCallback` with `maxWait`, `flush()`, `cancel()` — `maxWait: 10_000` enforces the API doc's ≤1 write/10 s budget during continuous typing, and `flush()` is exactly what submit/tab-hide need; hooks-native, actively maintained. https://www.npmjs.com/package/use-debounce | One new (tiny) dependency |
| `lodash.debounce` | Battle-tested | Not hook-aware (stale-closure footguns with React state); pulls lodash packaging |
| Hand-rolled `useRef` + `setTimeout` hook | Zero deps | `maxWait` + flush-on-unmount + cancel-on-409 is precisely the fiddly part; rewriting it is where autosave bugs live |

**Recommendation: `use-debounce`.** The repo is dependency-light, but flush/maxWait
semantics are load-bearing for test integrity (a lost final draft means lost answers), so
the maintained implementation wins over a bespoke one.

### 3.3 Play-once listening audio

| Candidate | Pros | Cons |
|---|---|---|
| **Native `<audio>` element, custom minimal UI** | We render exactly one Play button and a non-interactive progress bar; no seek/replay affordance exists to disable; `onended` fires the played-flag autosave; zero deps (the existing exercise page already uses `<audio>`) | We style ~50 lines of UI ourselves |
| `react-h5-audio-player` | Polished full player UI, a11y, no deps. https://github.com/lhz516/react-h5-audio-player , https://www.npmjs.com/package/react-h5-audio-player | Its entire purpose is the rich control surface (seek bar, jump buttons, replay) that a play-once constraint must remove; we'd install a UI library to hide its UI |
| `howler.js` | Web Audio power (sprites, cross-fade) | Massive overkill for one linear MP3 stream; adds an audio graph we then have to restrict |

**Recommendation: native element** wrapped in a `PlayOnceAudio` component (hidden
`controls`, custom button, `timeupdate`-driven read-only progress). Play-once is a UI
*subtraction* problem; libraries only add surface.

### 3.4 Explicitly no new state library

Attempt/section state lives in TanStack Query (server truth) plus one `useState` answers
map per section — the same shape `app/(app)/exercises/[id]/page.tsx` already uses. No
Zustand/Redux/XState: the section state machine has three states and the server is the
arbiter, so a reducer in `useSectionRunner` is sufficient.

---

## 4. Design

### 4.1 Route map

| Route (URL) | File | Layout | Purpose |
|---|---|---|---|
| `/mock-tests` | `app/(app)/mock-tests/page.tsx` | AppShell | Catalog + my attempts + resume banner |
| `/mock-tests/[id]` | `app/(app)/mock-tests/[id]/page.tsx` | AppShell | Template detail, rules, Start test |
| `/mock-tests/attempts/[attemptId]` | `app/(test)/mock-tests/attempts/[attemptId]/page.tsx` | **`(test)` minimal layout** | Full-screen runner (all sections) |
| `/mock-tests/attempts/[attemptId]/report` | `app/(app)/mock-tests/attempts/[attemptId]/report/page.tsx` | AppShell | Score report (student + teacher view) |

Route groups don't affect URLs (verified against the bundled Next 16 docs,
`node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`), so the
`(test)` group cleanly opts the runner out of `app/(app)/layout.tsx` (AppShell +
`useRealtimeNotifications`) without URL games. `app/(test)/layout.tsx` replicates only the
auth guard from `(app)/layout.tsx` (redirect to `/login` when unauthenticated) and renders
`children` full-bleed — no nav, no websocket. Path resolution is unambiguous: the runner
URL has three segments, `/mock-tests/[id]` has two, the report has four.

### 4.2 Component tree (new: `components/mock-test/`)

```
(test) runner page
└─ TestRunnerShell            — sticky header: template title, section pill, SaveIndicator, SectionTimer
   ├─ SectionIntro            — instructions, duration, "Start section" (POST …/start/)
   ├─ SectionRunner           — one in_progress section; owns answers state + autosave
   │  ├─ QuestionPalette      — numbered grid, answered/current/flagged, scroll-to
   │  ├─ ExercisePane (×N per section, ordered)
   │  │  ├─ passage: content_text          (reuses the two-column pattern of exercises/[id])
   │  │  ├─ PlayOnceAudio                  (listening; §3.3)
   │  │  ├─ QuestionCard ×M               ← components/quiz/QuestionCard, unchanged
   │  │  ├─ WritingTaskPane               — textarea + wordCount (lib/format.ts)
   │  │  └─ SpeakingTaskPane              — uses shared lib hook useRecorder (§6; doc 04 FE §4.3)
   │  └─ SubmitSectionDialog  — Modal (components/ui.tsx); flushes autosave, POST …/submit/
   ├─ TimeUpDialog            — locked state; Submit only (FE5/FE11)
   └─ AttemptFinished         — routes to the report

(app) report page
└─ ScoreReport
   ├─ OverallScoreCard        — band/scaled total or "partial" state + estimated-score note
   ├─ SectionScoreCard ×N     — converted score, raw correct/total, or PendingGradingCard (W/S)
   └─ AnswersReview           ← components/quiz/AnswersReview per receptive submission
```

### 4.3 Data fetching

**Query keys** — extend `lib/query-keys.ts` (`qk`) following the existing factory style:

```ts
mockTestFormats: ["mock-tests", "formats"] as const,
mockTestTemplates: ["mock-tests", "templates"] as const,
mockTestTemplate: (id: number) => ["mock-tests", "templates", id] as const,
myTestAttempts: ["mock-tests", "attempts", "me"] as const,
testAttempt: (id: number) => ["mock-tests", "attempts", id] as const,
testAttemptReport: (id: number) => ["mock-tests", "attempts", id, "report"] as const,
```

**API functions** — add to `lib/api.ts` using `apiFetch`, one function per student-facing
endpoint in API-doc §4.4 — authoring/admin endpoints (template write, conversion tables)
get no MVP UI (§1) — (`listTestFormats`, `listMockTestTemplates`, `getMockTestTemplate`,
`createTestAttempt`, `listMyTestAttempts`, `getTestAttempt`, `startSection`,
`autosaveSection`, `submitSection`, `getTestAttemptReport`). `autosaveSection` PATCHes the
draft envelope; treat `ApiError.status === 409` (code `section_expired`) as a state
transition, not an error toast.

**Hooks** — add to `lib/hooks.ts`:

- `useMyTestAttempts()` — attempt list (`qk.myTestAttempts`) for the catalog and its
  resume banner (Phase F2).
- `useTestAttempt(id)` — attempt detail; the response's `server_time` is captured into the
  countdown offset in the same render pass (`useServerCountdown` takes the whole query
  result so offset and data can never disagree).
- `useStartSection(attemptId)` — mutation; `onSuccess` invalidates `qk.testAttempt(id)`.
- `useAutosaveSection(attemptId, sectionId)` — plain mutation, **no invalidation** (local
  state is authoritative mid-section; refetching the draft we just wrote would clobber
  in-flight typing). Retry once on network error; surface status via `SaveIndicator`.
- `useSubmitSection(attemptId)` — invalidates `qk.testAttempt`, `qk.testAttemptReport`,
  `qk.mySubmissions` (submissions now exist in the normal inbox/history).
- `useTestAttemptReport(id)` — `refetchInterval: (q) => q.state.data?.partial ? 30_000 : false`
  so W/S scores appear without a manual refresh.

**zod schemas** — new `lib/mock-tests.ts` (sibling of `lib/exercises.ts`):

```ts
export const draftEnvelopeSchema = z.object({
  answers: z.record(z.string(), z.record(z.string(), z.unknown())).default({}), // exercise_id → AnswersPayload-shaped
  writing: z.record(z.string(), z.string()).default({}),                        // exercise_id → draft text
  meta: z.object({ audio_played: z.array(z.number()).default([]) }).default({ audio_played: [] }),
});
export type DraftEnvelope = z.infer<typeof draftEnvelopeSchema>;
```

This mirrors the envelope in API-doc §4.1 (`SectionAttempt.draft_answers`). On resume,
`draftEnvelopeSchema.safeParse(section.draft_answers)` guards the `unknown` JSON; a parse
failure falls back to an empty draft rather than crashing the runner. Per-question answers
inside `answers` reuse `AnswersPayload` built by `buildAnswers` (`lib/exercises.ts`) so the
backend grades mock answers with the identical shape it already grades practice quizzes.

### 4.4 Timer, autosave, and resume mechanics

- **`useServerCountdown(expiresAt, serverTime)`** — computes `offset` once per attempt
  fetch, ticks every 500 ms, returns `{ remainingMs, phase: "normal" | "warning" | "critical" | "expired" }`.
  On `expired`, `SectionRunner` cancels pending autosave (it would 409 anyway) and shows
  `TimeUpDialog`.
- **Autosave** — one `useDebouncedCallback(save, 3_000, { maxWait: 10_000 })` per section;
  every answer/typing change updates React state then calls the debounced saver with the
  full envelope (single-envelope PATCH matches the backend's single-row UPDATE). `flush()`
  is called before submit and in a `visibilitychange → hidden` listener (best-effort on tab
  close; `navigator.sendBeacon` is not usable because it cannot carry the JWT Authorization
  header). A `beforeunload` prompt warns while a section is in progress.
- **Resume** — the runner derives everything from `GET /api/mock-tests/attempts/{id}/`:
  sections `completed` → skipped; a section `in_progress` → hydrate from draft + countdown
  from `expires_at`; all `not_started` → next section's intro. There is no client-side
  persistence to reconcile (deliberate — see §6).
- **Fill-blank note** — `resolveQuestionType`/`FillBlankInput` detect blanks via `[[…]]`
  markers in `Question.text`. The answer-blind runner serializer must therefore emit masked
  text that *keeps empty markers in place* (`[[]]`), which makes blank count implicit and
  lets both components work unmodified. This is the one frontend-driven detail to pin with
  the backend before Phase 2 of the API plan (flagged in §7).

### 4.5 UX flow (student happy path)

1. `/mock-tests` → pick template → detail page shows sections, per-section durations,
   play-once and no-going-back rules → **Start test** (`POST …/attempts/`) → runner.
2. Section intro → **Start section** (server clock starts *here*, not at attempt creation)
   → runner with palette + timer.
3. Answer freely within the section; palette tracks progress; autosave indicator cycles
   Saved/Saving. Listening: press Play once; the bar fills; no second play.
4. **Submit section** (dialog warns about unanswered questions, flushes autosave) → next
   intro. Timer at 0 → locked TimeUpDialog → Submit (graded from last accepted draft).
5. After the last section → report. L/R cards show bands + raw counts immediately; W/S show
   "Pending grading"; overall appears when the report stops being partial (30 s poll).
   Disconnect at any point → reopening `/mock-tests` shows the resume banner → step 2/3.

---

## 5. Implementation Guidelines

Frontend work is gated on backend Phases 1–3 of the API doc (attempt engine + report), then:

**Phase F1 — types & plumbing.** Run `yarn gen:api` against the new schema; add aliases
(`TestFormat`, `MockTestTemplate`, `TestSection`, `TestAttempt`, `SectionAttempt`,
`TestAttemptReport`) to `lib/types/index.ts`; add API functions to `lib/api.ts`, keys to
`lib/query-keys.ts`, hooks to `lib/hooks.ts`; create `lib/mock-tests.ts` (zod envelope,
`useServerCountdown`, palette-state helper). Add `use-debounce` to `package.json`.

**Phase F2 — catalog & start.** `app/(app)/mock-tests/page.tsx` + `[id]/page.tsx`; add the
nav item in `components/layout.tsx`; resume banner off `useMyTestAttempts`.

**Phase F3 — runner core (receptive sections).** `app/(test)/layout.tsx`,
runner page, `TestRunnerShell`, `SectionIntro`, `SectionRunner`, `QuestionPalette`,
`SectionTimer`, `SaveIndicator`, `SubmitSectionDialog`, `TimeUpDialog` in
`components/mock-test/`; autosave + resume + 409 handling. Reading sections only first
(no audio dependency), reusing `QuestionCard`.

**Phase F4 — listening & productive sections.** `PlayOnceAudio` with persisted played
flag; `WritingTaskPane`; `SpeakingTaskPane` consumes the shared `useRecorder()` hook
(`lib/use-recorder.ts`, specified in doc 04's frontend doc §4.3 — permission state machine,
Blob + object URL). If mock tests land before pronunciation practice, build the hook here to
that spec rather than extracting the exercise page's base64 recorder; the Blob is converted
to a data URL only at submit (while `audio_recording_url` remains a string field). Migrating
the exercise page onto the hook stays the follow-up doc 04 FE §6 describes.

**Phase F5 — report.** Report page + score cards + `AnswersReview` reuse + partial
polling + estimated-score disclaimer.

**Phase F6 — enhancements.** Optional Fullscreen API toggle; flag-for-review palette
state; teacher class-results view; report invalidation via the existing
`feedback_posted` websocket event (add `qk.testAttemptReport` invalidation in
`useRealtimeNotifications`, `lib/hooks.ts`) replacing the 30 s poll.

---

## 6. Integration with Existing Code

**Reused deliberately**
- `components/quiz/QuestionCard` (+ `McqOptions`, `TrueFalse`, `FillBlankInput`,
  `ShortAnswer`) — rendered unchanged inside `ExercisePane`; `AnswersReview` on the report.
- `lib/exercises.ts` — `AnswerState`, `resolveQuestionType`, `buildAnswers`, `isComplete`
  (palette "answered" state and submit-dialog warnings are `isComplete` per question).
- `lib/api.ts` `apiFetch` — token refresh, DRF error normalization, and the `ApiError`
  class give the 409 handling for free.
- `lib/query-keys.ts` factory pattern, `lib/hooks.ts` hook conventions,
  `components/ui.tsx` primitives (`Card`, `Button`, `Modal`, `Badge`, `Skeleton`,
  `ErrorState`), `lib/format.ts` `wordCount`, the auth guard pattern from
  `app/(app)/layout.tsx`.
- The two-column passage/questions layout from `app/(app)/exercises/[id]/page.tsx` as the
  visual baseline for `ExercisePane`.

**Deliberately NOT reused**
- **localStorage drafts** (`elw_draft_ex_*` pattern in the exercise page) — the server
  draft is the single source of truth for resume; a second client-side copy would need
  conflict resolution against `draft_answers` and could resurrect answers into an expired
  section. Local React state + server autosave only.
- **`getExercise` / `useExercise`** in any runner path — that serializer leaks
  `is_correct` (API-doc N1). The runner consumes only the attempt-detail runner payload.
- **`useRealtimeNotifications` in the `(test)` layout** — it invalidates dashboard/class
  queries the runner never renders, and the runner should not react to background events
  mid-test. (Report-page websocket invalidation is the Phase F6 enhancement instead.)
- **The exercise page's inline recorder code** — not extracted: it is superseded by the
  shared `useRecorder()` hook (`lib/use-recorder.ts`, doc 04 FE §4.3) that
  `SpeakingTaskPane` consumes (Phase F4); the exercise page keeps its current behavior
  until migrated in the follow-up doc 04 FE §6 describes.

---

## 7. Risks & Open Questions

1. **Masked fill-blank convention.** §4.4's `[[]]` empty-marker convention must be agreed
   with the backend before the runner serializer ships; if the backend instead emits
   `blank_count` + fully stripped text, `FillBlankInput` needs a variant. Small either way,
   but it is a cross-repo contract — decide once, early.
2. **Play-once is honor-system.** The audio file URL is fetchable directly (and is a mock
   string today per the API doc's Risk 1); a motivated student can replay outside our UI.
   Signed, expiring media URLs arrive with the shared file-storage infrastructure
   (doc 04 backend §3.3: local `MEDIA_ROOT` now, S3 + presigned GET later).
3. **Draft-loss window.** Debounce (3 s, maxWait 10 s) means a hard crash can lose up to
   ~10 s of answers. Acceptable per the API doc's write-volume budget; revisit only with
   evidence.
4. **Speaking recordings are base64 data URLs** (current recorder behavior) — a full
   Speaking section inflates `draft_answers`/`Submission.audio_recording_url` badly. MVP:
   keep recordings out of the autosave envelope (attach at submit only) and cap duration;
   real fix is the shared upload infrastructure (doc 04 backend §3.3/Phase 0: real
   `FileField` uploads + server-side ffmpeg transcode).
5. **Timer drift within a section.** Offset is computed from `server_time` at fetch time;
   a long section accumulates no *new* server syncs unless autosave responses also carry
   `server_time` (cheap backend add — recommended) for re-sync every write.
6. **`use-debounce` is the only new dependency** — confirm team appetite; the fallback
   custom hook is described in §3.2 but carries the flush/maxWait bug surface.
7. **Authoring UI gap.** Teachers create templates via API/admin until a later brief;
   is that acceptable for launch? (Product decision, mirrors API-doc open question 7.)
