// Pure annotation logic — NO DOM in the math (except domRangeToOffsets, which
// is the single DOM boundary). Offsets are Unicode CODE POINTS end-exclusive,
// matching the server's anchor unit (backend doc 03 NFR4). The renderer splits
// text across many spans, so we measure UTF-16 offsets off the container and
// convert to code points here — the server's quoted_text integrity check turns
// any residual drift into a 400 rather than a silent bad anchor.
import { z } from "zod";

// ---- UTF-16 <-> code point conversion -------------------------------------
/** Count code points in `text[0..utf16Offset)`. */
export function utf16ToCodePoints(text: string, utf16Offset: number): number {
  let cp = 0;
  let i = 0;
  const limit = Math.min(utf16Offset, text.length);
  while (i < limit) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        i += 2;
        cp += 1;
        continue;
      }
    }
    i += 1;
    cp += 1;
  }
  return cp;
}

/** UTF-16 index at code-point offset `cpOffset`. */
export function codePointsToUtf16(text: string, cpOffset: number): number {
  let cp = 0;
  let i = 0;
  while (cp < cpOffset && i < text.length) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        i += 2;
        cp += 1;
        continue;
      }
    }
    i += 1;
    cp += 1;
  }
  return i;
}

// ---- DOM selection -> code-point offsets ----------------------------------
export interface OffsetResult {
  start: number; // code points, inclusive
  end: number; // code points, exclusive
  quoted: string;
}

/** UTF-16 length of the text from the container's start up to (node, offset). */
function utf16OffsetWithin(
  container: HTMLElement,
  node: Node,
  offset: number,
): number | null {
  try {
    const pre = document.createRange();
    pre.selectNodeContents(container);
    pre.setEnd(node, offset);
    return pre.toString().length;
  } catch {
    return null;
  }
}

/**
 * Convert a live selection Range into canonical code-point offsets + the quote,
 * or null for an invalid selection (collapsed / outside the container). `text`
 * is the canonical API string — we slice the quote from it, never from the DOM.
 */
export function domRangeToOffsets(
  container: HTMLElement,
  range: Range,
  text: string,
): OffsetResult | null {
  if (range.collapsed) return null;
  if (
    !container.contains(range.startContainer) ||
    !container.contains(range.endContainer)
  ) {
    return null;
  }
  const a = utf16OffsetWithin(container, range.startContainer, range.startOffset);
  const b = utf16OffsetWithin(container, range.endContainer, range.endOffset);
  if (a == null || b == null) return null;
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  if (lo === hi) return null;
  const start = utf16ToCodePoints(text, lo);
  const end = utf16ToCodePoints(text, hi);
  const cps = Array.from(text);
  const quoted = cps.slice(start, end).join("");
  return { start, end, quoted };
}

// ---- Overlap-aware segment splitting --------------------------------------
export interface Segment {
  key: string;
  text: string;
  annotationIds: number[];
}

interface AnnotationRange {
  id: number;
  start_offset: number;
  end_offset: number;
}

/**
 * Split `text` into segments between all annotation boundaries; each segment is
 * tagged with the ids of every annotation covering it. Canonical overlap
 * algorithm (backend doc 03 §4.5). Offsets are code points.
 */
export function buildSegments(
  text: string,
  annotations: AnnotationRange[],
): Segment[] {
  const cps = Array.from(text);
  const n = cps.length;
  const boundaries = new Set<number>([0, n]);
  for (const a of annotations) {
    boundaries.add(Math.max(0, Math.min(a.start_offset, n)));
    boundaries.add(Math.max(0, Math.min(a.end_offset, n)));
  }
  const sorted = [...boundaries].sort((x, y) => x - y);
  const segments: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const from = sorted[i];
    const to = sorted[i + 1];
    if (from >= to) continue;
    const annotationIds = annotations
      .filter((a) => a.start_offset <= from && a.end_offset >= to)
      .map((a) => a.id);
    segments.push({ key: `${from}-${to}`, text: cps.slice(from, to).join(""), annotationIds });
  }
  return segments;
}

// ---- Zod schemas -----------------------------------------------------------
export const annotationCategorySchema = z.enum([
  "grammar",
  "vocabulary",
  "spelling",
  "coherence",
  "task_response",
  "praise",
  "other",
]);

// Shared by the create + edit popover forms (via zodResolver).
export const annotationFormSchema = z.object({
  category: annotationCategorySchema,
  comment: z.string().trim().min(1, "Comment is required").max(2000),
  suggested_correction: z.string().max(2000).optional(),
});
export type AnnotationFormValues = z.infer<typeof annotationFormSchema>;

// Runtime guard for the Phase 2 websocket payload.
export const annotationEventSchema = z.object({
  event: z.literal("annotation_posted"),
  submission_id: z.number(),
});
