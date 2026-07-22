# Reading & Listening Quiz/Exercise Upgrade Plan

**Goal:** Let students actually *answer* Reading and Listening exercises with interactive
question types — multiple choice (A/B/C/D), fill-in-the-blank (word filling), true/false,
and short answer — then submit those answers for scoring.

**Status today:** the backend already models exercises → questions → options, but the
**frontend never renders questions**. The exercise viewer only shows a free-text textarea
(writing) or an audio recorder (speaking). Reading passages, listening audio, and all
multiple-choice questions are invisible and unanswerable.

---

## 1. Current state (verified)

### Data model (OpenAPI-generated, `lib/types/api.d.ts`)

| Type | Key fields | Notes |
|------|-----------|-------|
| `Exercise` ([:794](../lib/types/api.d.ts#L794)) | `exercise_type` (`reading\|listening\|quiz\|writing\|speaking`), `prompt_text`, `content_text?`, `audio_prompt_url?`, `questions: Question[]` | `content_text` = reading passage. `audio_prompt_url` = listening clip. |
| `Question` ([:944](../lib/types/api.d.ts#L944)) | `text`, `order?`, `options: QuestionOption[]` | **No `question_type` field.** |
| `QuestionOption` ([:953](../lib/types/api.d.ts#L953)) | `text`, `is_correct?`, `order?` | Only structure for MCQ correct answers. |
| `Submission` ([:1041](../lib/types/api.d.ts#L1041)) | `submission_type`, `writing_text?`, `audio_recording_url?`, `answers?: unknown`, `auto_score` (read-only) | `answers` is free-form JSON. Server computes `auto_score`. |

Friendly aliases re-exported from `lib/types/index.ts`. **Do not hand-edit `api.d.ts`** — it is
regenerated via `yarn gen:api` from the backend schema.

### What works / what's missing

- ✅ Backend can store MCQ: `Question.options[].is_correct`.
- ✅ `Submission.answers` accepts arbitrary JSON; `lib/api.ts:261` `createSubmission` passes the
  whole body through, so we can send answers with **no API-client change**.
- ❌ [`app/(app)/exercises/[id]/page.tsx`](../app/(app)/exercises/[id]/page.tsx) ignores
  `ex.questions` entirely. It renders a textarea (`writing`/`reading`/`listening`/`quiz`) or a
  recorder (`speaking`), and on submit sends only `writing_text` / `audio_recording_url` —
  **`answers` is never populated**.
- ❌ Reading `content_text` is never shown. `audio_prompt_url` is shown **only** when
  `exercise_type === "speaking"` (the prompt audio for listening is hidden).
- ❌ Submission viewer [`app/(app)/submissions/[id]/page.tsx`](../app/(app)/submissions/[id]/page.tsx)
  renders only `writing_text`, never the `answers` object.
- ❌ No fill-in-the-blank, true/false, or short-answer support anywhere.

### Tech stack

- Next.js (App Router, `"use client"` pages), React, TanStack Query (`lib/hooks.ts`).
- Tailwind CSS. Shared primitives in `components/ui.tsx`: `Card`, `Button`, `Badge`,
  `TextField`, `Skeleton`, `ErrorState`, `Tabs`, `Modal`.
- Data fetch via `lib/api.ts` (`apiFetch`), query keys in `lib/query-keys.ts`.
- Badge color map already covers `reading`/`listening`/`quiz` ([`ui.tsx:141`](../components/ui.tsx#L141)).

---

## 2. Question-type strategy

The backend `Question` has **no `question_type` field**. Two paths:

### Option A — Frontend-only convention (ship first, no backend change) ✅ recommended start

Derive type from existing data with zero schema change:

| Derived type | Detection rule |
|--------------|----------------|
| **Multiple choice (A/B/C/D)** | `options.length >= 2`, the standard case |
| **True / False** | `options.length === 2` whose texts are `True`/`False` |
| **Fill-in-the-blank** | `options.length === 0` **and** `text` contains a blank marker (e.g. `___` or `[[blank]]`) |
| **Short answer** | `options.length === 0` and no blank marker |

For fill-blank scoring under Option A, the expected word(s) are encoded in the question `text`
using a delimiter the renderer hides, e.g. `The capital of France is [[Paris]].` → renders an
input where the blank is, accepts `Paris` (case-insensitive, trimmed). Client can preview-grade;
server auto-score depends on backend support (see §6).

**Pros:** zero backend coordination, deployable now. **Cons:** convention is implicit;
fill-blank correct answers live in `text`, which is fragile and visible in the API payload.

### Option B — Add an explicit `question_type` (clean, needs backend)

Add to backend `Question`:
- `question_type: "mcq" | "fill_blank" | "true_false" | "short_answer"`
- For fill-blank: `correct_answers: string[]` (or reuse `options` with `is_correct` as the
  accepted strings, no rendered choices).

Then regenerate `api.d.ts` (`yarn gen:api`) and branch the renderer on `question_type`.

**Recommendation:** Build the renderer in **Option A** so it ships immediately, but structure
the code so swapping to an explicit `question_type` (Option B) is a one-line change in the
`resolveQuestionType()` helper. Track Option B as the backend follow-up.

---

## 3. `answers` JSON contract — **fixed by the backend**

The backend grader (`core/models.py` `Submission.grade()`) already defines the shape — the
frontend must match it, not invent its own:

```jsonc
// answers = { "<question_id>": [<selected_option_id>, ...] }
{
  "67": [1],     // single-choice MCQ → one option id
  "68": [6],     // true/false → the chosen option id
  "69": [10, 12] // multi-answer → multiple ids (grade() compares the full set)
}
```

Grading: a question is correct when the selected option-id **set exactly equals** the set of
options flagged `is_correct`. Score = `100 * correct / total_questions` (Decimal, 0–100),
or `null` when the exercise has no questions.

Implications for the frontend:
- MCQ / true-false / **gap-fill-with-options (word filling)** all submit option ids → fully
  auto-graded today.
- **Pure free-text fill-blank and short answer are NOT gradable** by this contract (no option
  ids). A question with 0 options scores as "correct" (empty set == empty pick) — so don't ship
  free-text receptive questions until the backend supports a text answer key. Model "word
  filling" as gap-fill **with options** for now (see the seed `seed_demo.py make_questions`).
- Build the payload in a tested helper `lib/exercises.ts` (`buildAnswers()`), not inline in the page.

> Demo data already exists: `english-learning-api` → `python manage.py seed_demo` creates 2
> reading + 2 listening exercises with MCQ, true/false, and word-filling questions, plus two
> auto-graded sample submissions (100% and 50%).

---

## 4. Implementation steps (frontend)

> Read `node_modules/next/dist/docs/` before writing code — per `AGENTS.md`, this Next.js
> version may differ from training data.

1. **`lib/exercises.ts` (new)** — pure helpers, unit-testable:
   - `resolveQuestionType(q: Question): QuestionType` (the §2 detection; single swap point for Option B).
   - `parseFillBlank(text): { segments: string[]; answers: string[] }` — splits on `[[...]]` markers.
   - `buildAnswers(questions, state): AnswersPayload` — produces the §3 JSON.
   - `previewScore(questions, state)` — optional client-side score for instant feedback.
   - `isComplete(questions, state)` — gate the Submit button.

2. **`components/quiz/` (new components)** — Tailwind, mirror `components/ui.tsx` style:
   - `QuestionCard.tsx` — wrapper: number, `question.text`, renders the right input by type.
   - `McqOptions.tsx` — radio group, labels rendered as **A / B / C / D** (index → letter),
     keyboard accessible (`role="radiogroup"`, arrow keys, `aria-checked`).
   - `FillBlankInput.tsx` — renders text with inline `<input>` where each blank is, one input per blank.
   - `TrueFalse.tsx` — two-button / radio variant of MCQ.
   - `ShortAnswer.tsx` — single-line/textarea `TextField`.

3. **Refactor [`app/(app)/exercises/[id]/page.tsx`](../app/(app)/exercises/[id]/page.tsx):**
   - Branch by `exercise_type`:
     - `writing` / `speaking` → keep existing textarea / recorder path **unchanged**.
     - `reading` → show `content_text` as a passage panel (left column already exists), then
       render `questions` list on the right.
     - `listening` → render `<audio controls src={ex.audio_prompt_url}>` (currently gated behind
       `speaking`), optionally a "plays remaining" counter, then the `questions` list.
     - `quiz` → render `questions` list (no passage/audio unless present).
   - Hold answers in a `Record<questionId, { optionId?: number; text?: string }>` state object
     (replace the single `text` string for question-based types).
   - On submit, call `buildAnswers(...)` and send
     `{ exercise_id, submission_type: ex.exercise_type, answers }` via the existing
     `useCreateSubmission()` — no new hook needed.
   - Keep the localStorage draft feature; key drafts by exercise and serialize the answers object.
   - Disable Submit until `isComplete(...)`.

4. **Submission viewer [`app/(app)/submissions/[id]/page.tsx`](../app/(app)/submissions/[id]/page.tsx):**
   - When `answers` is present, render a read-only review: each question, the chosen/typed answer,
     and (if the exercise + `is_correct` are available) correct/incorrect markers + `auto_score`.

5. **Module exercise list** — ensure reading/listening/quiz exercises link into the viewer
   (entry point is `app/(app)/modules/[id]/page.tsx`). Add a question-count badge if useful.

6. **Empty/edge states** — exercise with `questions.length === 0`, audio failing to load, no
   `content_text` for a reading exercise.

---

## 5. Teacher authoring (optional, phase 2)

Today exercises are created via `useCreateExercise` (`ExerciseRequest`) but **questions/options
have no create hook** (`QuestionRequest`/`QuestionOptionRequest` exist in the schema but aren't
wired in `lib/api.ts`/`lib/hooks.ts`). To let teachers build quizzes in-app:

- Add `api.createQuestion` / `api.createQuestionOption` + matching hooks.
- A question-builder UI (add question → pick type → add options, mark correct).
- Defer until the student-facing renderer (§4) is verified.

---

## 6. Backend coordination (call out explicitly)

Frontend-only work (§4) makes MCQ/true-false **fully answerable and submittable today**, because
`answers` is free JSON and the server already auto-scores MCQ via `is_correct`.

Needs backend for:
- **Fill-blank / short-answer auto-scoring** — server must know accepted answers. Either
  Option B's `correct_answers`, or agree that fill-blank correct text lives in `options[].text`
  with `is_correct = true` (rendered as a blank, not as choices).
- **Explicit `question_type`** (Option B) — schema change + `yarn gen:api` regen.
- Confirm how the grader reads the §3 `answers` shape (align the contract before shipping).

---

## 7. Sample / seed data

Add example reading and listening exercises (with questions + options) so the UI is testable
without the live backend — e.g. a fixture used by `testsprite_tests/` or a dev seed:

- **Reading:** `content_text` passage + 3 MCQ + 1 fill-blank.
- **Listening:** `audio_prompt_url` (mock URL) + 3 MCQ + 1 true/false.

---

## 8. Testing

- **Unit** (`lib/exercises.ts`): `resolveQuestionType`, `parseFillBlank`, `buildAnswers`,
  `isComplete`, `previewScore`.
- **Component**: MCQ selection, fill-blank typing, keyboard a11y, Submit gating.
- **E2E** (`testsprite_tests/` already present): open a reading exercise → answer MCQ +
  fill-blank → submit → see it in `/submissions` → verify `auto_score`.
- A11y: radiogroup semantics, labels tied to inputs, focus states.

---

## 9. Phasing

| Phase | Scope | Backend needed? |
|-------|-------|-----------------|
| **1** | MCQ + true/false rendering, `answers` submission, reading passage + listening audio, submission review | No |
| **2** | Fill-in-the-blank + short answer (Option A convention) with client preview score | Auto-score: yes |
| **3** | Explicit `question_type` (Option B), teacher question authoring UI | Yes |

Ship Phase 1 first — it unlocks the largest gap (questions are currently unanswerable) with no
backend dependency.

---

## 10. File-change checklist

- [ ] `lib/exercises.ts` — new helpers + types (`QuestionType`, `AnswersPayload`).
- [ ] `components/quiz/QuestionCard.tsx`, `McqOptions.tsx`, `FillBlankInput.tsx`, `TrueFalse.tsx`, `ShortAnswer.tsx`.
- [ ] `app/(app)/exercises/[id]/page.tsx` — branch by type, render questions, build `answers`.
- [ ] `app/(app)/submissions/[id]/page.tsx` — render `answers` review.
- [ ] `app/(app)/modules/[id]/page.tsx` — (optional) question-count badge / entry polish.
- [ ] Tests in `testsprite_tests/` + unit tests for `lib/exercises.ts`.
- [ ] (Phase 3) `lib/api.ts` + `lib/hooks.ts` — question/option create; regen `api.d.ts`.
