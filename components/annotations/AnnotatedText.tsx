"use client";
// Renders the immutable writing_text as overlap-split segments; teacher view
// captures selections and opens the create popover. One renderer for teacher
// (interactive) and student (read-only) so the two can never diverge.
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useCreateAnnotation } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import type { WritingAnnotation } from "@/lib/types";
import {
  buildSegments,
  domRangeToOffsets,
  type AnnotationFormValues,
  type Segment,
} from "@/lib/annotations";
import { CATEGORY_STYLES } from "./categories";
import { useAnnotationUI } from "./AnnotationContext";
import { SelectionPopover } from "./SelectionPopover";
import { AnnotationForm } from "./AnnotationForm";

interface PendingSelection {
  start: number;
  end: number;
  quoted: string;
  rect: DOMRect;
}

export function AnnotatedText({
  submissionId,
  text,
  annotations,
  interactive = false,
}: {
  submissionId: number;
  text: string;
  annotations: WritingAnnotation[];
  interactive?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<PendingSelection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateAnnotation(submissionId);
  const { activeId, setActiveId, scrollToCard, registerSegment } =
    useAnnotationUI();

  const segments = useMemo(() => buildSegments(text, annotations), [text, annotations]);
  const byId = useMemo(
    () => new Map(annotations.map((a) => [a.id, a])),
    [annotations],
  );

  const captureSelection = () => {
    if (!interactive) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const container = containerRef.current;
    if (!container) return;
    const range = sel.getRangeAt(0);
    const res = domRangeToOffsets(container, range, text);
    if (!res) return;
    setError(null);
    setSelection({ ...res, rect: range.getBoundingClientRect() });
  };

  const closePopover = () => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const onSave = async (values: AnnotationFormValues) => {
    if (!selection) return;
    setError(null);
    try {
      await create.mutateAsync({
        submission_id: submissionId,
        start_offset: selection.start,
        end_offset: selection.end,
        quoted_text: selection.quoted,
        category: values.category,
        comment: values.comment,
        suggested_correction: values.suggested_correction?.trim() || null,
      });
      closePopover();
    } catch (err) {
      // A quoted_text field error means our offset math drifted (doc 03 risk 1).
      if (err instanceof ApiError && err.fieldErrors?.quoted_text) {
        setError("Couldn’t anchor this selection — please reselect.");
      } else {
        setError(
          err instanceof ApiError ? err.message : "Failed to save annotation.",
        );
      }
    }
  };

  // Register the first segment of each annotation for scroll targeting.
  const seen = new Set<number>();

  return (
    <div>
      <div
        ref={containerRef}
        onMouseUp={captureSelection}
        onKeyUp={captureSelection}
        className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800"
      >
        {segments.map((seg) => {
          const firstIds = seg.annotationIds.filter((id) => !seen.has(id));
          firstIds.forEach((id) => seen.add(id));
          return (
            <SegmentSpan
              key={seg.key}
              seg={seg}
              firstIds={firstIds}
              byId={byId}
              activeId={activeId}
              onActivate={(id) => {
                setActiveId(id);
                scrollToCard(id);
              }}
              register={registerSegment}
            />
          );
        })}
      </div>

      {interactive && (
        <SelectionPopover
          rect={selection?.rect ?? null}
          open={!!selection}
          onOpenChange={(open) => {
            if (!open) closePopover();
          }}
        >
          <AnnotationForm
            quote={selection?.quoted}
            submitting={create.isPending}
            error={error}
            submitLabel="Add annotation"
            onSubmit={onSave}
            onCancel={closePopover}
          />
        </SelectionPopover>
      )}
    </div>
  );
}

function SegmentSpan({
  seg,
  firstIds,
  byId,
  activeId,
  onActivate,
  register,
}: {
  seg: Segment;
  firstIds: number[];
  byId: Map<number, WritingAnnotation>;
  activeId: number | null;
  onActivate: (id: number) => void;
  register: (id: number, el: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    firstIds.forEach((id) => register(id, ref.current));
    return () => firstIds.forEach((id) => register(id, null));
  });

  const covering = seg.annotationIds
    .map((id) => byId.get(id))
    .filter((a): a is WritingAnnotation => Boolean(a));

  if (covering.length === 0) {
    return <span>{seg.text}</span>;
  }

  const first = CATEGORY_STYLES[covering[0].category];
  const second = covering[1] ? CATEGORY_STYLES[covering[1].category] : null;
  const active = activeId != null && seg.annotationIds.includes(activeId);

  const cycle = () => {
    const ids = covering.map((a) => a.id);
    const idx = activeId == null ? -1 : ids.indexOf(activeId);
    onActivate(ids[(idx + 1) % ids.length]);
  };

  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${first.label} note: ${covering[0].comment}`}
      onClick={cycle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cycle();
        }
      }}
      className={cn(
        "cursor-pointer rounded-[2px] border-b-2",
        covering.length >= 3
          ? "border-zinc-400 bg-zinc-200"
          : cn(first.markClass, (second ?? first).underlineClass),
        active && "ring-2 ring-teal-500 ring-offset-1",
      )}
    >
      {seg.text}
      {covering.length >= 3 && (
        <sup className="text-[0.6rem] font-bold text-zinc-600">
          +{covering.length}
        </sup>
      )}
    </span>
  );
}
