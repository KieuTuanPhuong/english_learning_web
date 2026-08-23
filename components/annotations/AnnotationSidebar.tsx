"use client";
// Sidebar list synced with the highlights. Cards sorted by start_offset; click
// scrolls to the highlight; author/admin can edit/delete; student can ack.
import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Button, Card, Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { timeAgo } from "@/lib/format";
import { ApiError } from "@/lib/api";
import {
  useAcknowledgeAnnotation,
  useDeleteAnnotation,
  useUpdateAnnotation,
} from "@/lib/hooks";
import type { WritingAnnotation } from "@/lib/types";
import type { AnnotationFormValues } from "@/lib/annotations";
import { CATEGORY_STYLES } from "./categories";
import { useAnnotationUI } from "./AnnotationContext";
import { AnnotationForm } from "./AnnotationForm";

export function AnnotationSidebar({
  submissionId,
  annotations,
  readOnly = false,
}: {
  submissionId: number;
  annotations: WritingAnnotation[];
  readOnly?: boolean;
}) {
  if (annotations.length === 0) {
    return readOnly ? null : (
      <Card className="text-xs text-zinc-500">
        Select any part of the student’s text to add an inline annotation.
      </Card>
    );
  }
  const sorted = [...annotations].sort((a, b) => a.start_offset - b.start_offset);
  return (
    <Card className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-700">
        Inline annotations ({sorted.length})
      </h3>
      <div className="space-y-2">
        {sorted.map((a) => (
          <AnnotationCard
            key={a.id}
            annotation={a}
            submissionId={submissionId}
            readOnly={readOnly}
          />
        ))}
      </div>
    </Card>
  );
}

function AnnotationCard({
  annotation,
  submissionId,
  readOnly,
}: {
  annotation: WritingAnnotation;
  submissionId: number;
  readOnly: boolean;
}) {
  const { user, role } = useAuth();
  const { activeId, setActiveId, scrollToSegment, registerCard } =
    useAnnotationUI();
  const update = useUpdateAnnotation(submissionId);
  const del = useDeleteAnnotation(submissionId);
  const ack = useAcknowledgeAnnotation(submissionId);
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerCard(annotation.id, ref.current);
    return () => registerCard(annotation.id, null);
  });

  const style = CATEGORY_STYLES[annotation.category];
  const canEdit =
    !readOnly && (annotation.author_id === user?.id || role === "admin");
  const active = activeId === annotation.id;

  const onSaveEdit = async (values: AnnotationFormValues) => {
    setError(null);
    try {
      await update.mutateAsync({
        id: annotation.id,
        body: {
          category: values.category,
          comment: values.comment,
          suggested_correction: values.suggested_correction?.trim() || null,
        },
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update.");
    }
  };

  return (
    <div
      ref={ref}
      onClick={() => {
        setActiveId(annotation.id);
        scrollToSegment(annotation.id);
      }}
      className={cn(
        "cursor-pointer rounded-md border p-2 text-sm transition",
        active ? "border-teal-400 bg-teal-50/40" : "border-zinc-200",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            style.badgeClass,
          )}
        >
          {style.label}
        </span>
        {canEdit && !editing && (
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Edit annotation"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              aria-label="Delete annotation"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              className="text-zinc-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <AnnotationForm
            defaultValues={{
              category: annotation.category,
              comment: annotation.comment,
              suggested_correction: annotation.suggested_correction ?? "",
            }}
            submitting={update.isPending}
            error={error}
            submitLabel="Save changes"
            onSubmit={onSaveEdit}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <p className="mt-1 line-clamp-2 border-l-2 border-zinc-300 pl-2 text-xs italic text-zinc-500">
            “{annotation.quoted_text}”
          </p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700">
            {annotation.comment}
          </p>
          {annotation.suggested_correction && (
            <p className="mt-1 text-xs text-emerald-700">
              Suggested: {annotation.suggested_correction}
            </p>
          )}
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[0.7rem] text-zinc-400">
              {timeAgo(annotation.created_at)}
            </span>
            {readOnly && annotation.author_id !== null ? (
              annotation.is_acknowledged ? (
                <span className="inline-flex items-center gap-1 text-[0.7rem] text-emerald-600">
                  <Check size={12} /> Acknowledged
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    ack.mutate(annotation.id);
                  }}
                  className="text-[0.7rem] text-teal-600 hover:underline"
                >
                  Mark as read
                </button>
              )
            ) : (
              !readOnly &&
              annotation.is_acknowledged && (
                <span className="inline-flex items-center gap-1 text-[0.7rem] text-emerald-600">
                  <Check size={12} /> Acknowledged
                </span>
              )
            )}
          </div>
        </>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete annotation?"
      >
        <p className="text-sm text-zinc-600">
          This removes the note on “{annotation.quoted_text.slice(0, 40)}…”.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={del.isPending}
            onClick={async () => {
              await del.mutateAsync(annotation.id);
              setConfirmDelete(false);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
