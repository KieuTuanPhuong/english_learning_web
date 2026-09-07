# Feature 4 — Pronunciation Practice (Frontend Research)

> Companion backend doc (source of truth for the API contract, models, endpoint paths, and
> engine choice): `english-learning-api/docs/research/04-pronunciation-practice.md`
> Status: research / design — no code written yet.

---

## 1. Overview & Goals

The web side of pronunciation practice gives **students** a fast record → score → retry loop:
browse drills (word / sentence / minimal-pair) in a practice hub, open a drill player, record
themselves against the target text, submit, and see color-coded word- and phoneme-level
feedback plus an attempt history. **Teachers/admins** get lightweight drill CRUD from the same
hub. The backend does all assessment (Azure Pronunciation Assessment behind a mock/real
backend switch — see backend doc §3); the frontend never touches engine credentials.

**Success criteria (frontend-specific)**

1. One full record → score → retry cycle is achievable without leaving the drill player, in
   under ~10 s (matching backend N1's ≤ 4 s p95 score latency).
2. Microphone permission handling is explicit: distinct UI for unsupported browser, permission
   pending, denied, and ready states — no silent failures.
3. Works on Chrome, Firefox, and Safari (desktop + iOS) with **native `MediaRecorder`** — the
   server transcodes whatever codec the browser produces (backend §3.3 pipeline A), so the
   frontend never re-encodes audio.
4. Phoneme feedback is legible and accessible: color is reinforced by score numbers and error
   labels, never color alone.
5. All server JSON crossing a `JSONField` boundary (`word_results`) is zod-validated before
   render, so a malformed engine payload degrades to a graceful fallback rather than a crash.

---

## 2. Requirements Breakdown

### Functional

| # | Requirement |
|---|---|
| WF1 | Practice hub route listing drills, filterable by `drill_type`, `difficulty`, and `module_id` (the exact query params from backend §4.2), grouped by difficulty. |
| WF2 | Drill player: target text (+ `contrast_text` for minimal pairs, + `phoneme_hint` IPA), record button with live level meter, playback of own recording pre- and post-submit, submit, scored feedback render, one-tap retry. |
| WF3 | `useRecorder()` hook wrapping `getUserMedia` + `MediaRecorder` with a permission/lifecycle state machine and a client-side 30 s hard stop (mirrors the server's ≤ 30 s / ≤ 5 MB caps). |
| WF4 | Feedback render: overall + accuracy/fluency/completeness/prosody scores; per-word chips colored by accuracy with `error_type` badges (`Omission` / `Insertion` / `Mispronunciation`); phoneme-level detail on tap/hover. |
| WF5 | Attempt history per drill (scores over time, replayable audio via `audio_url`) and a cross-drill "my attempts" view backed by `GET /api/pronunciation/attempts/me/`. |
| WF6 | Teacher/admin drill CRUD (create/edit/delete) from the hub via the existing `Modal` pattern; `created_by` is server-set and never sent. |
| WF7 | Multipart upload support in the shared API client (today `buildRequest` force-sets `Content-Type: application/json` on every body — this breaks `FormData`; flagged in backend §4.5). |

### Non-functional

| # | Requirement |
|---|---|
| WN1 | No new heavyweight frontend dependency for MVP (see §3 — the level meter is a hand-rolled canvas). |
| WN2 | Strict TypeScript throughout; API types come from `yarn gen:api` → `lib/types/api.d.ts`, aliased in `lib/types/index.ts` as usual. Never hand-edit `api.d.ts`. |
| WN3 | Recorder resources are always released (tracks stopped, object URLs revoked) on unmount, navigation, and retry. |
| WN4 | Graceful handling of the backend's DRF throttle (30 attempts/hour/student → 429) and of upload validation errors (size/duration field errors). |
| WN5 | Score color thresholds respect the `strictness` the attempt serializer passes through (backend §4.4: strictness shifts display thresholds, not scores). |

---

## 3. Tools & Technology Choice

The backend doc already settles the two big frontend-adjacent decisions — native
`MediaRecorder` (no client-side WAV encoding) and a canvas level meter instead of
wavesurfer.js at MVP. This section records the comparison behind the frontend half of those
calls.

### 3.1 Recording

| Option | Pros | Cons |
|---|---|---|
| **Native `MediaRecorder` + `getUserMedia` (recommended)** | Zero dependencies; already used in `app/(app)/exercises/[id]/page.tsx`; opus uploads are tiny (~20 KB / 10 s); server transcode absorbs all codec differences | Codec varies by browser (webm/opus on Chrome/Firefox, mp4/aac on Safari) — but the server normalizes anyway (backend §3.3) |
| `extendable-media-recorder` + WAV encoder | Engine-ready-ish WAV output | ~10× larger uploads; still can't guarantee 16 kHz mono, so the server resample survives; new dependency. Rejected in backend §3.3. https://github.com/chrisguttandin/extendable-media-recorder |
| `react-media-recorder` / similar React wrappers | Slightly less boilerplate | Thin wrappers over the same API; we need a custom state machine (permission states, max-duration stop) anyway, so a wrapper adds indirection without removing work |

**Recommendation: native `MediaRecorder` in a custom `useRecorder()` hook.** Pick the mime
type at runtime with `MediaRecorder.isTypeSupported` in preference order
`audio/webm;codecs=opus` → `audio/webm` → `audio/mp4`, and send whatever we got; the server's
ffmpeg step is the single normalization point.

### 3.2 Waveform / level visualization

| Option | Pros | Cons |
|---|---|---|
| **Hand-rolled canvas level meter via Web Audio `AnalyserNode` (recommended, per backend §4.5)** | ~60 lines, zero deps; live "it's hearing you" feedback is the actual UX need; trivially styled with Tailwind tokens | Not a scrubbing waveform — but the player `<audio controls>` covers playback |
| wavesurfer.js v7 (+ RecordPlugin) | Polished rendered waveform, active project (v7.12.x on npm, MIT), has a purpose-built record plugin — https://www.npmjs.com/package/wavesurfer.js · https://wavesurfer.xyz/docs/classes/plugins_record.default | A full player library to render a 10-second mic level; Shadow-DOM styling friction with Tailwind; overkill for MVP |
| CSS-only pulse animation | Zero code | No actual signal feedback — a muted/broken mic looks identical to a working one, which defeats the point |

**Recommendation: hand-rolled `AnalyserNode` canvas meter** for MVP, exactly as the backend
doc directs. Revisit wavesurfer.js in Phase 3 only if a scrubbable waveform with per-word
timing highlights becomes a real ask (Azure returns word offsets in `engine_metadata`, so the
data would exist).

### 3.3 Everything else — already in the stack

- **TanStack Query 5** for all fetching/mutations (`lib/hooks.ts` conventions).
- **zod 4** (already in `package.json`, currently unused in `lib/`) to validate
  `word_results` — the same runtime-validation pattern docs 01–03 adopt; whichever feature
  lands first is zod's first real `lib/` consumer.
- **react-hook-form** for the teacher drill form modal (existing forms all use plain `useForm`
  validation — no resolver anywhere yet). Wiring `drillFormSchema` in via `zodResolver` would
  require adding `@hookform/resolvers`, which is **not** in `package.json`; validating in the
  submit handler with `drillFormSchema.safeParse` avoids the new package. (If doc 03's
  annotations feature — which adds `@hookform/resolvers` for its popover form — lands first,
  `DrillFormModal` may switch to `zodResolver`; the `safeParse` plan applies only while the
  package is absent.)
- **lucide-react** icons (`Mic`, `Square`, `Play`, `RotateCcw`, `History`).
- No new dependencies for MVP (use `safeParse` for the drill form rather than adding
  `@hookform/resolvers`).

---

## 4. Design

### 4.1 Route map

All pages are `"use client"` pages following the existing `app/(app)/*` dynamic-route pattern
(e.g. `app/(app)/exercises/[id]/page.tsx`).

| Route | File | Who | Purpose |
|---|---|---|---|
| `/pronunciation` | `app/(app)/pronunciation/page.tsx` | all roles | Practice hub: drill list grouped by difficulty, filters (type / difficulty / module), teacher "New drill" button → modal |
| `/pronunciation/[drillId]` | `app/(app)/pronunciation/[drillId]/page.tsx` | student focus; teachers can preview | Drill player: target text, recorder, feedback, attempt history |

Nav: add a "Pronunciation" link (Mic icon) to the app chrome in `app/(app)/layout.tsx`,
visible to all roles.

### 4.2 Component tree

```
app/(app)/pronunciation/page.tsx
├─ PageHeader                        (components/ui.tsx)
├─ DrillFilters                      (components/pronunciation/DrillFilters.tsx)
│    type pills · difficulty select · module select (reuses qk.modules data)
├─ DrillGroup ("Beginner" | …)       — grouping by difficulty_level, per hub spec
│    └─ DrillCard ×N                 (components/pronunciation/DrillCard.tsx)
│         Badge(drill_type) · target_text · phoneme_hint · best-score chip (from attempts/me)
│         [teacher] edit / delete actions
└─ DrillFormModal                    (components/pronunciation/DrillFormModal.tsx)
     react-hook-form + drillFormSchema (§4.6, via safeParse); create & edit; Modal from ui.tsx

app/(app)/pronunciation/[drillId]/page.tsx
├─ DrillHeader                       — Badge, target_text large, phoneme_hint (IPA, muted)
│    └─ MinimalPairBanner            — only when drill_type === "minimal_pair":
│         "ship" ▸ vs ◂ "sheep"      (contrast_text is display-only; backend §7 note)
├─ RecorderPanel                     (components/pronunciation/RecorderPanel.tsx)
│    ├─ useRecorder()                (lib/use-recorder.ts) — state machine below
│    ├─ LevelMeter                   (components/pronunciation/LevelMeter.tsx — canvas)
│    ├─ Record / Stop / Re-record buttons · elapsed timer · 30 s countdown
│    └─ <audio controls>             — playback of local blob via URL.createObjectURL
├─ AttemptResult                     (components/pronunciation/AttemptResult.tsx)
│    ├─ ScoreSummary                 — overall dial + accuracy/fluency/completeness bars
│    │                                 (prosody bar rendered only when prosody_score != null)
│    ├─ WordFeedback                 — per-word chips, color by threshold, error_type badge
│    │    └─ PhonemeDetail           — expandable row/popover: phoneme × accuracy list,
│    │                                 e.g. /ʃ/ 22 (red) · /iː/ 88 (green) · /p/ 95 (green)
│    └─ Retry button                 — resets recorder, keeps history visible
└─ AttemptHistory                    (components/pronunciation/AttemptHistory.tsx)
     compact list: date · overall score · mini score delta · play (audio_url)
```

`ScoreSummary` reuses `ProgressBar` and `Card` from `components/ui.tsx`; nothing from
`components/quiz/` is used (see §6).

### 4.3 `useRecorder()` state machine (`lib/use-recorder.ts`)

```
unsupported ──(no mediaDevices/MediaRecorder)──────────────┐
idle ──start()──▶ requesting ──granted──▶ recording        │ terminal states
                     │                        │            │ render dedicated UI
                     └─denied──▶ denied ◀─────┘ (revoked)  ┘
recording ──stop() | 30 s timer──▶ recorded { blob, mimeType, durationMs, objectUrl }
recorded ──reset()──▶ idle          (revoke objectUrl, release tracks)
```

Hook API:

```ts
const {
  state,          // "unsupported" | "idle" | "requesting" | "denied" | "recording" | "recorded"
  start, stop, reset,
  elapsedMs,      // ticking while recording (drives the countdown)
  analyser,       // AnalyserNode | null — consumed by <LevelMeter/>
  result,         // { blob, mimeType, durationMs, objectUrl } | null
  error,          // string | null (NotAllowedError → denied copy, NotFoundError → "no mic")
} = useRecorder({ maxDurationMs: 30_000 });
```

Implementation notes:

- Feature-detect up front: `navigator.mediaDevices?.getUserMedia` and `window.MediaRecorder`
  → `unsupported` with explanatory copy (very old browsers / non-secure origins).
- Do **not** rely on `navigator.permissions.query({ name: "microphone" })` — support is
  uneven; derive `denied` from the `NotAllowedError` rejection instead, and show "check your
  browser's site settings" copy with a retry button.
- Mime selection via the `isTypeSupported` chain (§3.1); pass the chosen type to both
  `new MediaRecorder(stream, { mimeType })` and the final `Blob`.
- `AudioContext` + `AnalyserNode` are created from the same stream for the level meter and
  closed on stop. Stop all `stream.getTracks()` in every exit path and on unmount (WN3).
- The existing exercises-page pattern of base64 `FileReader.readAsDataURL` is deliberately
  **not** copied — we upload the raw `Blob` in `FormData` and preview via object URL
  (cheaper, no 33 % base64 inflation, and the backend expects a real file part).
- `useRecorder()` is the platform's shared recorder hook: doc 01's mock-test
  `SpeakingTaskPane` (its FE doc Phase F4) consumes the same hook — build it once, to this
  spec, in whichever feature lands first.

### 4.4 API client additions (`lib/api.ts`)

**Prerequisite fix (WF7):** in `buildRequest` (currently line 106), only default the
`Content-Type` header when the body is not `FormData` — the browser must set the multipart
boundary itself:

```ts
if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
  headers.set("Content-Type", "application/json");
}
```

New functions (paths exactly as backend §4.2):

```ts
export function listPronunciationDrills(params?: {
  drill_type?: DrillType; difficulty?: DifficultyLevel; module_id?: number;
}): Promise<PronunciationDrill[]>            // GET  /api/pronunciation/drills/  (+querystring)
export function getPronunciationDrill(id: number): Promise<PronunciationDrill>
export function createPronunciationDrill(body: PronunciationDrillRequest): Promise<PronunciationDrill>
export function updatePronunciationDrill(id: number, body: Partial<PronunciationDrillRequest>): Promise<PronunciationDrill>
export function deletePronunciationDrill(id: number): Promise<void>

export function createPronunciationAttempt(drillId: number, audio: Blob, mimeType: string) {
  const form = new FormData();
  form.append("audio", audio, `attempt.${extFromMime(mimeType)}`);   // field name per §4.2
  return apiFetch<PronunciationAttempt>(`/api/pronunciation/drills/${drillId}/attempts/`, {
    method: "POST", body: form,
  });
}
export function listDrillAttempts(drillId: number): Promise<PronunciationAttempt[]>
export function listMyPronunciationAttempts(params?: { drill_id?: number }): Promise<PronunciationAttempt[]>
```

Types come from `yarn gen:api` after the backend lands (`@extend_schema` on the multipart
endpoint is backend phase-1 step 9); alias them in `lib/types/index.ts`:
`PronunciationDrill`, `PronunciationDrillRequest`, `PronunciationAttempt`,
`DrillType` (`"word" | "sentence" | "minimal_pair"`).

### 4.5 Query keys (`lib/query-keys.ts`) and hooks (`lib/hooks.ts`)

```ts
// lib/query-keys.ts additions — same factory style as submissionsInbox
pronunciationDrills: (f?: { drill_type?: string; difficulty?: string; module_id?: number }) =>
  ["pronunciation", "drills", f ?? {}] as const,
pronunciationDrill: (id: number) => ["pronunciation", "drills", id] as const,
drillAttempts: (drillId: number) => ["pronunciation", "drills", drillId, "attempts"] as const,
myPronunciationAttempts: (f?: { drill_id?: number }) =>
  ["pronunciation", "attempts", "me", f ?? {}] as const,
```

Hooks follow the `useClasses`/`useCreateX` conventions in `lib/hooks.ts`:

- `usePronunciationDrills(filters)`, `usePronunciationDrill(id)`,
  `useDrillAttempts(drillId)`, `useMyPronunciationAttempts(filters)`.
- `useSubmitAttempt(drillId)` — mutation wrapping `createPronunciationAttempt`. The 201
  response **is** the fully scored attempt (synchronous assessment, backend §3.4), so
  `onSuccess`: prepend to `qk.drillAttempts(drillId)` via `setQueryData` (list is ordered
  `-created_at`) and invalidate `qk.myPronunciationAttempts()`. No polling at MVP; if the
  backend later goes async ("processing" state), this mutation is the single place to add it.
- Drill CRUD mutations invalidate the `["pronunciation", "drills"]` prefix.

### 4.6 zod schemas (`lib/pronunciation.ts`)

`word_results` is a `JSONField` — the generated type will be `unknown`, so it gets a runtime
guard (contract shape from backend §4.3). DRF serializes `DecimalField` as **strings** by
default, so all scores coerce:

```ts
const score = z.coerce.number().min(0).max(100);

export const phonemeResultSchema = z.object({
  phoneme: z.string(),          // IPA, e.g. "ʃ"
  accuracy: score,
});

export const wordResultSchema = z.object({
  word: z.string(),
  accuracy: score,
  error_type: z.enum(["None", "Omission", "Insertion", "Mispronunciation"]).nullish(),
  phonemes: z.array(phonemeResultSchema).default([]),
});

export const wordResultsSchema = z.array(wordResultSchema);

export function parseWordResults(raw: unknown): WordResult[] | null {
  const r = wordResultsSchema.safeParse(raw);
  return r.success ? r.data : null;   // null → AttemptResult renders scores without breakdown
}
```

Also here: `drillFormSchema` (validates `DrillFormModal` input in the submit handler via
`safeParse` — `contrast_text` required iff `drill_type === "minimal_pair"` via `.superRefine`;
see §3.3 on why not `zodResolver`) and the threshold helper:

```ts
// Strictness shifts DISPLAY thresholds only (backend §4.4). Standard: green ≥80, amber ≥60.
export function scoreTone(accuracy: number, strictness: Strictness = "standard"): "green" | "amber" | "red";
```

Chips render tone + numeric score + `error_type` label (accessibility: never color alone;
`Omission` chips show the word struck-through, `Insertion` chips show it dashed-outlined).

### 4.7 UX flows

**Student happy path.** Hub → filter/pick drill → player shows target + IPA →
tap Record (first time: browser permission prompt over the `requesting` state) → live meter +
countdown → Stop (or auto-stop at 30 s) → optional self-playback → Submit → button shows
spinner "Scoring…" (1–4 s) → `AttemptResult` animates in with scores + word chips → tap a red
word → phoneme detail → Retry resets the recorder, previous result collapses into
`AttemptHistory`.

**Permission denied.** `denied` state replaces the record button with an inline explainer
("Microphone blocked — enable it in your browser's site settings") + a "Try again" button that
re-invokes `getUserMedia`. Never auto-request on page load; only on the first Record tap
(also required on iOS Safari, where `getUserMedia` must follow a user gesture).

**Errors.** 429 (throttle, backend: 30/hour) → friendly "You're practicing fast! Try again in
a few minutes" message, submit disabled briefly. 4xx validation (too long / too large) →
`ApiError.fieldErrors` surfaced under the recorder. Network/5xx → `ErrorState` with retry;
the local recording blob is retained so the student can resubmit without re-recording.

**Minimal pairs.** Both words shown with their IPA; the scored target is `target_text` only
(backend §7 open question — the contrast word is pedagogy/UI). Copy: "Say: **ship** — not
*sheep*".

---

## 5. Implementation Guidelines

**Phase 0 — client plumbing (blocked only by backend phase 1 landing)**
1. `lib/api.ts`: `buildRequest` FormData fix (§4.4). Safe to ship immediately — no current
   caller sends FormData.
2. Backend merges → `yarn gen:api`; add aliases to `lib/types/index.ts`.
3. `lib/query-keys.ts`: four new keys (§4.5). `lib/api.ts`: eight new functions (§4.4).
4. `lib/pronunciation.ts`: zod schemas, `parseWordResults`, `scoreTone` (§4.6) — unit-test
   these against the §4.3 fixture JSON from the backend doc.

**Phase 1 — MVP student loop**
5. `lib/use-recorder.ts`: the hook + state machine (§4.3). Manually verify on Chrome,
   Firefox, Safari desktop, iOS Safari (mimeType fallback path).
6. `components/pronunciation/LevelMeter.tsx` (canvas + `requestAnimationFrame`, torn down
   when `analyser` goes null).
7. `app/(app)/pronunciation/page.tsx` hub: `usePronunciationDrills`, `DrillFilters`,
   `DrillCard`, difficulty grouping. Add the nav link in `app/(app)/layout.tsx`.
8. `app/(app)/pronunciation/[drillId]/page.tsx` player: `RecorderPanel`, `useSubmitAttempt`,
   `AttemptResult` (`ScoreSummary` + `WordFeedback` + `PhonemeDetail`), retry loop.
9. `AttemptHistory` from `useDrillAttempts` (replay via `audio_url`).

**Phase 2 — teacher authoring + polish**
10. `DrillFormModal` (react-hook-form + `drillFormSchema`), hub CRUD actions gated on
    `me.role !== "student"`, matching the role-gating style used elsewhere in `app/(app)/`.
11. Best-score chips on `DrillCard` (derive from `useMyPronunciationAttempts()` in the hub).
12. Cross-drill history section on the hub or profile page (`/api/pronunciation/attempts/me/`).

**Phase 3 — enhancements (each optional, independent)**
13. wavesurfer.js RecordPlugin upgrade if scrubbable waveforms / word-timing highlights get
    prioritized (§3.2).
14. Score-over-time sparkline in `AttemptHistory`.
15. Module detail page (`app/(app)/modules/[id]/page.tsx`): list the module's drills beside
    its exercises (backend exposes `?module_id=` filtering already).
16. If the backend adds async assessment: extend `useSubmitAttempt` with a
    `refetchInterval`-based poll on a `processing` status.

---

## 6. Integration with Existing Code

**Reused**
- `lib/api.ts` `apiFetch` (incl. its 401-refresh-retry) — FormData rides through the same
  client after the one-line `buildRequest` fix; `ApiError.fieldErrors` drives upload errors.
- `lib/query-keys.ts` factory style and `lib/hooks.ts` query/mutation conventions, verbatim.
- `lib/types/index.ts` alias layer over generated `api.d.ts` (the `DifficultyLevel` alias
  already exists and is reused for filters and the drill form).
- `components/ui.tsx`: `PageHeader`, `Card`, `Badge`, `Button`, `Modal`, `ProgressBar`,
  `Skeleton`, `EmptyState`, `ErrorState`, `Spinner` — the feature is composed from existing
  primitives plus the new `components/pronunciation/*` folder.
- The `"use client"` dynamic-route page pattern from `app/(app)/exercises/[id]/page.tsx`.
- zod + react-hook-form (already dependencies) for the drill form; zod additionally gets its
  first `lib/` runtime-validation role here.

**Deliberately NOT reused**
- **`components/quiz/*`** — nothing question-shaped here; drills have no
  `Question`/`QuestionOption` structure (backend §6).
- **The inline recording code in `app/(app)/exercises/[id]/page.tsx`** — it base64-encodes
  audio into `Submission.audio_recording_url` (the mock-URL-string era) and has no permission
  state machine. `useRecorder()` supersedes it; migrating the speaking-exercise page onto the
  hook is a nice follow-up but out of scope, because that page's contract (data-URL string in
  a JSON body) differs from this feature's real multipart upload.
- **`lib/ws.ts` websockets** — assessment is synchronous request/response (backend §3.4);
  no push channel needed. Revisit only alongside a future async backend.
- **Submission/Feedback hooks and views** (`useMySubmissions`, submissions pages) — attempts
  are a separate resource with a separate lifecycle by design (backend §6); mixing them into
  the submissions UI would put unlimited practice noise into graded-work views.

---

## 7. Risks & Open Questions

| Risk / question | Notes / mitigation |
|---|---|
| Safari `MediaRecorder` quirks (mp4/aac only, occasional empty first `dataavailable`) | Mime fallback chain + accumulate all chunks and build the Blob on `stop`; test on real iOS early (Phase 1 step 5 explicitly includes it). Server transcode absorbs the codec (backend §3.3). |
| `getUserMedia` requires a secure context | Fine on localhost + production HTTPS; document that LAN-IP device testing needs a tunnel or `localhost` port-forward. |
| Permission state cannot be reliably pre-queried | We derive `denied` from rejection instead of `navigator.permissions` (§4.3); the trade-off is one failed prompt before we can show the "unblock in settings" copy. |
| DRF Decimal-as-string scores | Handled once by `z.coerce.number()` in §4.6; do not sprinkle `parseFloat` in components. |
| `word_results` shape drift between mock and Azure backends | `parseWordResults` fails soft (scores render, breakdown hidden) and logs; the backend's contract tests pin the shape (backend §7), so drift is a backend bug we survive, not crash on. |
| `strictness` field availability on the attempt serializer | Backend §4.4 says it's passed through; if it ships later, `scoreTone` defaults to `"standard"` — no blocker, just note it in the PR. |
| Tab backgrounded mid-recording (mobile suspends timers/AudioContext) | 30 s hard cap bounds the damage; also stop recording on `visibilitychange → hidden` as a safety. |
| Object-URL leaks across retries | `useRecorder.reset()` and unmount both revoke; cover in the hook's unit tests. |
| Attempt list growth per drill (unlimited retries) | `qk.drillAttempts` list stays cheap at MVP; if students rack up hundreds of attempts, ask backend for pagination on `GET .../attempts/` — open question, flag when it hurts. |
| Do teachers need a drill *preview* recorder? | Player currently lets any authenticated user view; only students may POST attempts (backend §4.2). MVP: teachers see the player with recording disabled + a hint. Open to change. |

**Sources**
- Backend contract & engine research: `english-learning-api/docs/research/04-pronunciation-practice.md`
- https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- https://www.npmjs.com/package/wavesurfer.js · https://wavesurfer.xyz/docs/classes/plugins_record.default
- https://github.com/chrisguttandin/extendable-media-recorder
