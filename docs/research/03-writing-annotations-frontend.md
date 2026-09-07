# Feature 3 — Inline Writing Annotations: Frontend Implementation

Companion to the API research doc, which is the source of truth for the
contract, model, and endpoint paths:
`english-learning-api/docs/research/03-writing-annotations.md`. This doc covers
only the web app (Next.js 16 App Router, React 19, TypeScript strict, TanStack
Query 5, Tailwind 4).

---

## 1. Overview & Goals

Teachers reviewing a writing submission on
`app/(app)/submissions/[id]/page.tsx` currently see `writing_text` as a plain
`whitespace-pre-wrap` paragraph. This feature turns that paragraph into an
annotatable surface: the teacher selects a span, a popover captures a
category + comment (+ optional suggested correction), and the span renders as
a color-coded highlight synced with a sidebar list. Students see the identical
renderer in read-only mode on their own submission page.

**Success criteria (frontend)**
- Select → categorize → save in ≤3 interactions, no page navigation.
- Offsets sent to the API are Unicode **code points** and always pass the
  server's `quoted_text == writing_text[start:end]` integrity check (a 400
  here means our offset math is wrong, not a user error).
- Overlapping annotations render deterministically via segment splitting; the
  same component renders teacher and student views so they can never diverge.
- No regression to the existing grading form, feedback history, or quiz
  review paths on the same page.

## 2. Requirements Breakdown

**Functional**
- FR-W1 Capture selections only inside the writing-text container; ignore
  collapsed, out-of-bounds, or cross-container selections.
- FR-W2 Popover editor: category (7 fixed choices from the API enum), comment
  (required), suggested correction (optional). Create and edit modes.
- FR-W3 Render highlights color-by-category; overlaps split into segments with
  stacked styles, capped at two visible category styles + a "+N" affordance
  (per API doc §7 risk 4).
- FR-W4 Sidebar list ordered by `start_offset`; click a card → scroll to and
  flash the highlight; click a highlight → activate and scroll the card.
- FR-W5 Author (or admin) can edit/delete from the sidebar card.
- FR-W6 Student read view: same renderer, read-only; Phase 2 adds an
  "Acknowledge" button per card.
- FR-W7 Annotation UI appears only when `submission.writing_text` is non-empty
  (mirrors the API's FR7 rejection of non-writing submissions).

**Non-functional**
- NFR-W1 Offset conversion (DOM UTF-16 ↔ code points) and segment splitting
  are pure functions in `lib/` — no DOM in the math, testable in isolation.
- NFR-W2 Render the exact string returned by the API (`whitespace-pre-wrap`,
  no trimming/normalization) — API doc §7 risk 3.
- NFR-W3 Performance: an essay is < ~10k chars with < 50 annotations; the
  O(n log n) segment build per render is negligible, but memoize it
  (`useMemo` on `[writing_text, annotations]`) so selection/hover state
  changes don't rebuild.
- NFR-W4 Accessibility: highlights are focusable with an `aria-label`
  ("Grammar note: …"), popover traps focus, flash animation respects
  `prefers-reduced-motion`.

## 3. Tools & Technology Choice

The API doc §3 already settled the big question — **custom annotation layer,
W3C selector vocabulary, no annotation library** (recogito successor too
heavy/DOM-anchored; recogito-js archived; react-text-annotate stale; TipTap
comments paid). This doc inherits that decision; the only choices left open
are frontend plumbing:

| Concern | Candidates | Choice & why |
|---|---|---|
| Popover positioning | (a) `@floating-ui/react`; (b) CSS anchor positioning; (c) hand-rolled `position: absolute` from `range.getBoundingClientRect()` | **(a) `@floating-ui/react`.** Actively maintained (v0.27.x, published within the last month, 1.8k+ dependents, peer `react >= 17` so React 19 is fine — https://www.npmjs.com/package/@floating-ui/react, https://floating-ui.com/docs/react). Its **virtual element** API positions a popover off a selection `Range`'s client rect — exactly our case — plus flip/shift collision handling and `useDismiss`/`useRole` interactions we'd otherwise hand-roll. Native CSS anchor positioning can't anchor to a text range, and hand-rolling breaks on viewport edges and scroll. ~10 kB, MIT, zero styling opinions so it composes with the existing `components/ui.tsx` kit (which has `Modal` but no popover primitive). |
| Selection → offsets | (a) `document.createTreeWalker` over text nodes (custom); (b) library | **(a) custom.** ~40 LOC; every library option was rejected upstream for exactly this layer. |
| Form validation | (a) react-hook-form rules only (current codebase pattern, e.g. the grading form); (b) zod 4 schema + `@hookform/resolvers` | **(b) zod.** `zod@^4.4.3` is already a dependency, currently unused in app code (docs 01/02/04 also plan consumers — whichever feature lands first is its first real consumer). The annotation form has an enum field and the payload needs runtime narrowing anyway (WS events, edit-mode defaults), so one schema serves form + payload. Adds the tiny `@hookform/resolvers` dependency. |
| Highlight rendering | (a) segment-split `<mark>` spans (custom); (b) CSS Custom Highlight API (`CSS.highlights`) | **(a) segments.** The Custom Highlight API paints ranges without DOM changes but cannot host click targets, `aria-label`s, or per-segment "+N" badges, and styling is limited to a small property set. Segments give us interactive, accessible nodes. Revisit (b) only if profiling ever shows re-render cost, which NFR-W3 makes unlikely. |

No other new dependencies: TanStack Query 5, react-hook-form, lucide-react,
Tailwind 4, and the generated `lib/types/api.d.ts` cover everything else.

## 4. Design

### 4.1 Route map

**No new routes.** Everything mounts inside the existing role-branched page:

| Route | Change |
|---|---|
| `app/(app)/submissions/[id]/page.tsx` — `TeacherGradingScreen` | Replace the plain `writing_text` paragraph (left column "Student Response" card) with `<AnnotatedText interactive>`; add `<AnnotationSidebar>` above the grading form in the right column |
| `app/(app)/submissions/[id]/page.tsx` — `StudentSubmissionDetail` | Replace the "Your answer" `writing_text` paragraph with `<AnnotatedText readOnly>`; render `<AnnotationSidebar readOnly>` under it when annotations exist |

The quiz (`AnswersReview`) and audio branches of both screens are untouched.

### 4.2 Component tree

```
app/(app)/submissions/[id]/page.tsx
├── TeacherGradingScreen (existing)
│   ├── AnnotationProvider                      // components/annotations/AnnotationContext.tsx
│   │   ├── AnnotatedText  (interactive)        // components/annotations/AnnotatedText.tsx
│   │   │   ├── <span data-segment>…            // one per segment, <mark>-styled when covered
│   │   │   └── SelectionPopover                // components/annotations/SelectionPopover.tsx
│   │   │       └── AnnotationForm              // components/annotations/AnnotationForm.tsx
│   │   └── AnnotationSidebar                   // components/annotations/AnnotationSidebar.tsx
│   │       └── AnnotationCard × N              //   card: category badge, quote, comment,
│   │           └── AnnotationForm (edit mode)  //   correction, edit/delete (author), ack (student)
│   └── …existing prompt / feedback / grading form…
└── StudentSubmissionDetail (existing)
    └── AnnotationProvider
        ├── AnnotatedText (readOnly)
        └── AnnotationSidebar (readOnly, Phase 2: acknowledge)
```

Supporting modules:
- `lib/annotations.ts` — pure logic + schemas (no React):
  - `utf16ToCodePoints(text, utf16Offset): number` and
    `codePointsToUtf16(text, cpOffset): number` — single pass, count
    surrogate pairs before the index.
  - `domRangeToOffsets(container, range, text): {start, end, quoted} | null`
    — TreeWalker (`NodeFilter.SHOW_TEXT`) sums preceding text-node lengths to
    get UTF-16 offsets (the renderer splits text across many spans, so range
    node offsets alone are meaningless), converts to code points, slices the
    quote from the canonical `text`; returns `null` for invalid selections.
  - `buildSegments(text, annotations): Segment[]` with
    `Segment = { key, text, annotationIds: number[] }` — convert each
    annotation's code-point offsets to UTF-16 once, collect boundaries
    `{0, len, all starts, all ends}`, sort + dedupe, emit one segment per
    consecutive pair tagged with covering annotation ids. This is the
    canonical overlap algorithm from API doc §4.5.
- `components/annotations/categories.ts` — `AnnotationCategory` →
  `{ label, badgeClass, markClass, underlineClass }` map (Tailwind literal
  class strings, e.g. grammar → red, vocabulary → amber, spelling → orange,
  coherence → sky, task_response → violet, praise → emerald, other → zinc).
- `AnnotationContext` — tiny context: `activeId`, `setActiveId`, hover state,
  and a `Map<annotationId, HTMLElement>` ref registry for scroll targeting.
  Scoped per page instance; deliberately not global state.

### 4.3 Data fetching (TanStack Query)

`lib/query-keys.ts` — one new factory beside `submissionFeedback`:

```ts
submissionAnnotations: (id: number) => ["submissions", id, "annotations"] as const,
```

`lib/types/index.ts` — aliases over the regenerated schema (run
`yarn gen:api` after the backend lands; verify the exact generated names in
`api.d.ts`, e.g. the enum may come out as `CategoryEnum`):

```ts
export type WritingAnnotation = S["WritingAnnotation"];
export type WritingAnnotationRequest = S["WritingAnnotationRequest"];
export type AnnotationCategory = S["CategoryEnum"]; // grammar|vocabulary|spelling|coherence|task_response|praise|other
```

`lib/api.ts` — five functions following the Feedback split (nested read,
top-level writes; paths exactly as API doc §4.2):

```ts
export function listSubmissionAnnotations(id: number): Promise<WritingAnnotation[]> {
  return apiFetch<WritingAnnotation[]>(`/api/submissions/${id}/annotations/`);
}
// Create is POST /api/annotations/ with submission_id in the body (mirrors createFeedback).
export function createAnnotation(body: WritingAnnotationRequest): Promise<WritingAnnotation>;
export function updateAnnotation(id: number, body: Partial<WritingAnnotationRequest>): Promise<WritingAnnotation>;
export function deleteAnnotation(id: number): Promise<void>;
export function acknowledgeAnnotation(id: number): Promise<WritingAnnotation>; // Phase 2, POST .../acknowledge/
```

`lib/hooks.ts` — mirrors the `useSubmissionFeedback` / `useCreateFeedback`
patterns; every mutation invalidates `qk.submissionAnnotations(submissionId)`:

```ts
export function useSubmissionAnnotations(id: number) {
  return useQuery({
    queryKey: qk.submissionAnnotations(id),
    queryFn: () => api.listSubmissionAnnotations(id),
    enabled: Number.isFinite(id),
  });
}
export function useCreateAnnotation(submissionId: number) { /* invalidate on success */ }
export function useUpdateAnnotation(submissionId: number) { /* mutationFn: ({id, body}) => … */ }
export function useDeleteAnnotation(submissionId: number) { /* … */ }
export function useAcknowledgeAnnotation(submissionId: number) { /* Phase 2 */ }
```

No optimistic updates in MVP: creates must round-trip anyway because the
server is the offset-integrity authority (a 400 must surface, not be painted
over). Lists are small; `invalidateQueries` refetch is imperceptible.

Phase 2 realtime: extend the `useRealtimeNotifications` switch in
`lib/hooks.ts` with
`if (m.event === "annotation_posted") qc.invalidateQueries({ queryKey: ["submissions"] })`
(coarse but consistent with the existing `feedback_posted` handling).

### 4.4 Zod schemas (`lib/annotations.ts`)

```ts
import { z } from "zod";

export const annotationCategorySchema = z.enum([
  "grammar", "vocabulary", "spelling", "coherence",
  "task_response", "praise", "other",
]);

// Popover form (create + edit share it via zodResolver)
export const annotationFormSchema = z.object({
  category: annotationCategorySchema,
  comment: z.string().trim().min(1, "Comment is required").max(2000),
  suggested_correction: z.string().max(2000).optional()
    .transform((v) => (v?.trim() ? v : undefined)),
});
export type AnnotationFormValues = z.infer<typeof annotationFormSchema>;

// Runtime guard for the Phase 2 websocket payload
export const annotationEventSchema = z.object({
  event: z.literal("annotation_posted"),
  submission_id: z.number(),
});
```

Offsets and `quoted_text` are not form fields — they come from the captured
selection held in component state and are merged into the request at submit.

### 4.5 UX flows

**Teacher creates.** `onMouseUp`/`onKeyUp` inside `AnnotatedText` reads
`window.getSelection()` → `domRangeToOffsets`. Valid selection ⇒ a small
floating "Annotate" button appears at the range rect (Floating UI virtual
element). Click ⇒ popover opens with the quote preview, category defaulting
to `grammar`, comment focused. Save ⇒ `createAnnotation({ submission_id,
start_offset, end_offset, quoted_text, ...form })` ⇒ on success clear
selection, close popover, list refetches, new highlight appears. Escape or
outside-click dismisses without saving (`useDismiss`).

**Overlap rendering.** Segment covered by one annotation: category
`markClass` background + `underlineClass` (`border-b-2`). Two: first
annotation's background + second's underline color. Three+: neutral
`bg-zinc-200` + a superscript `+N` badge; clicking cycles `activeId` through
the covering set. The active annotation's segments get a ring
(`ring-2 ring-offset-1`) so one annotation is always visually isolable.

**Sidebar sync.** Cards sorted by `start_offset` (server order). Card click ⇒
`setActiveId` + `scrollIntoView({ block: "center", behavior: "smooth" })` on
the first registered segment + a ~1.2 s flash class (skipped under
`prefers-reduced-motion`). Highlight click ⇒ `setActiveId` + scroll sidebar
card. Edit opens `AnnotationForm` inline in the card (offsets unchanged —
re-anchoring requires reselecting in the text, per API FR3). Delete uses the
existing `Modal` confirm pattern.

**Student reads.** Same components with `readOnly`: no selection handlers, no
popover; cards show category, quote, comment, correction ("Suggested: …"),
author/date via `timeAgo`. Phase 2 adds the Acknowledge button ⇒
`useAcknowledgeAnnotation` ⇒ card shows a check; teachers see "Acknowledged"
on their side after refetch.

**Errors.** 400 with `fieldErrors.quoted_text` ⇒ inline popover message
"Couldn't anchor this selection — please reselect." (and log: it means our
offset math drifted). 403 ⇒ `ApiError.message` surfaced in the popover, same
pattern as the grading form's `formError`.

## 5. Implementation Guidelines

**Phase 0 — contract sync** (after backend Phase 1 merges)
1. Backend running locally → `yarn gen:api`; add the three aliases to
   `lib/types/index.ts`. `yarn typecheck`.

**Phase 1 — MVP (teacher annotates, student reads)**
2. `lib/annotations.ts`: offset converters, `domRangeToOffsets`,
   `buildSegments`, zod schemas. Pure functions first — exercise them against
   fixtures with emoji/astral chars and CRLF text. (No test runner exists in
   this repo yet; adding `vitest` for just this file is cheap and worth it —
   this is the code that must never silently drift. Decide at implementation
   time; if skipped, keep the manual fixture script in the PR description.)
3. `lib/query-keys.ts`: add `submissionAnnotations`.
4. `lib/api.ts`: the five fetchers (acknowledge can land now, unused).
5. `lib/hooks.ts`: query + mutation hooks with invalidation.
6. `yarn add @floating-ui/react @hookform/resolvers`.
7. `components/annotations/categories.ts` + `AnnotationContext.tsx`.
8. `components/annotations/AnnotatedText.tsx`: memoized `buildSegments`
   render, segment registry, selection capture, active/hover styling.
9. `components/annotations/AnnotationForm.tsx` (react-hook-form +
   `zodResolver(annotationFormSchema)`, reusing `TextArea`, `TextField`,
   `Button` from `components/ui.tsx`) and `SelectionPopover.tsx`
   (Floating UI `useFloating` + virtual element, `useDismiss`, `useRole`).
10. `components/annotations/AnnotationSidebar.tsx` with `AnnotationCard`
    (edit/delete gated on `author_id === me.id || role === "admin"` via
    `useAuth`).
11. Wire into `app/(app)/submissions/[id]/page.tsx`: teacher branch
    (interactive) and student branch (read-only), only when
    `submission.writing_text` is non-empty. `yarn lint && yarn typecheck`.

**Phase 2 — Enhancements**
12. Acknowledge flow (student button, teacher-visible state).
13. `annotation_posted` case in `useRealtimeNotifications` once the backend
    emits it via `_broadcast_class`.
14. Category filter chips + per-category counts in the sidebar header.
15. If/when the AI annotation pass ships (API doc §4.6): render
    `author_id === null` rows with the existing `AiTag` instead of the
    teacher avatar — no other frontend change needed.

**Non-goals** (inherited from the API doc): annotating speaking/receptive
submissions, threaded replies, rich-text comments, annotation on exercise
prompts or study materials.

## 6. Integration with Existing Code

**Reused**
- `app/(app)/submissions/[id]/page.tsx` role branching, layout columns, and
  its existing hooks (`useSubmissionsInbox`, `useMySubmissions`,
  `useSubmissionFeedback`) — annotations are additive cards in each column.
- `lib/api.ts` `apiFetch` (auth, refresh-retry, DRF error normalization →
  `ApiError.fieldErrors` powers the quote-mismatch message) and the
  "nested read / top-level write" convention established by feedback.
- `lib/query-keys.ts` factory style — `["submissions", id, "annotations"]`
  sits naturally under the existing `["submissions", id, "feedback"]` family.
- `components/ui.tsx`: `Card`, `Badge`, `Button`, `TextArea`, `TextField`,
  `Modal` (delete confirm), `Skeleton`, `AiTag` (Phase 2 AI rows), `Avatar`.
- `lib/format.ts` `timeAgo`/`dateLabel`; `lib/auth-context.tsx` for role and
  author gating; `lib/ws.ts` + `useRealtimeNotifications` for Phase 2.
- Generated `lib/types/api.d.ts` — zero hand-written DTOs, same as every
  other resource.

**Deliberately NOT reused**
- `components/quiz/*` (incl. `AnswersReview`): they render question/response
  structures; span rendering shares nothing with them. They remain the
  `answers` branch of the same page, untouched.
- `Feedback` form/hooks as a vehicle for annotations: annotations are
  per-row CRUD with offsets and authorship — a parallel resource, exactly as
  the API doc argues (§6).
- Global state (context beyond the page, or query-cache-as-UI-state) for
  `activeId`/hover: it's ephemeral per-view UI state; page-scoped context is
  simpler and SSR-safe.
- `dangerouslySetInnerHTML` / HTML string building for highlights: segments
  are plain React nodes; no sanitization surface.

## 7. Risks & Open Questions

| # | Risk / question | Mitigation |
|---|---|---|
| 1 | **Offset math drift** (UTF-16 vs code points; renderer splitting text across spans). The server's quote check converts drift into a 400, but a recurring 400 is a broken feature. | All math in pure `lib/annotations.ts` functions; convert at the DOM boundary only; fixtures with astral chars; treat any `quoted_text` 400 in the wild as a P1 bug, and show the reselect message so the teacher isn't blocked. |
| 2 | Selection capture fights the re-render: saving an annotation re-segments the DOM and can invalidate the live `Range`. | Capture offsets + quote into React state at `mouseup` (before any mutation); never hold a `Range` across renders; position the popover off a cached rect. |
| 3 | Precise selection across nested marks is fiddly (double-click word-select spanning segment boundaries; browser differences). | Segments are plain inline spans (no `contenteditable`, no `user-select` overrides); TreeWalker math is agnostic to how many spans a selection crosses. Manual QA on Safari/Firefox, whose selection edge behavior differs. |
| 4 | Long essays with dense annotations: sidebar↔text sync gets disorienting on small screens where the sidebar stacks below the text. | On `lg:` keep two columns (existing page grid); below, sidebar collapses to a count pill that opens the existing `Modal` with the list. Phase 1 ships the simple stacked layout; refine after teacher feedback. |
| 5 | `@floating-ui/react` version churn (0.x semver). | Surface area used is small (`useFloating`, virtual elements, `useDismiss`, `useRole`); pin the minor version; it is the ecosystem-standard positioning layer with 1.8k+ dependents (https://www.npmjs.com/package/@floating-ui/react). |
| 6 | Does the teacher need to annotate from the inbox list view too? | Out of scope: annotation requires the full text surface; the inbox already links to this page. Revisit only with user demand. |
| 7 | Should students get an unread indicator for new annotations? | Open; depends on the Phase 2 `annotation_posted` event shipping. A dashboard count would reuse the existing notifications channel — defer. |
| 8 | Coexistence with doc 02's rubric grade form (same screen, same right column). | Mirror of doc 02 FE risk 5: proposal — left column keeps text + inline annotations (inline pass); right column stacks the annotation sidebar above the rubric matrix + comments (overall pass). A small design pass by whichever feature merges second resolves it; `components/annotations/*` and `components/rubric/*` stay independent. |

**Sources**
- https://www.npmjs.com/package/@floating-ui/react
- https://floating-ui.com/docs/react
- W3C Web Annotation model (vocabulary inherited from the API doc): https://www.w3.org/TR/annotation-model/
