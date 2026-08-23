"use client";
// Shared create/edit form: category select + comment + optional correction.
// zod is the first hookform resolver user in the app (doc 03 §3).
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, TextArea } from "@/components/ui";
import { annotationFormSchema, type AnnotationFormValues } from "@/lib/annotations";
import { CATEGORY_OPTIONS } from "./categories";

export function AnnotationForm({
  defaultValues,
  quote,
  submitting = false,
  error,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  defaultValues?: Partial<AnnotationFormValues>;
  quote?: string;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit: (values: AnnotationFormValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnotationFormValues>({
    resolver: zodResolver(annotationFormSchema),
    defaultValues: {
      category: defaultValues?.category ?? "grammar",
      comment: defaultValues?.comment ?? "",
      suggested_correction: defaultValues?.suggested_correction ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      {quote && (
        <p className="line-clamp-2 rounded bg-zinc-100 px-2 py-1 text-xs italic text-zinc-600">
          “{quote}”
        </p>
      )}
      <label className="block space-y-1">
        <span className="block text-xs font-medium text-zinc-700">Category</span>
        <select
          className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 focus:border-accent focus:outline-none"
          {...register("category")}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <TextArea
        label="Comment"
        rows={3}
        error={errors.comment?.message}
        {...register("comment")}
      />
      <TextArea
        label="Suggested correction (optional)"
        rows={2}
        {...register("suggested_correction")}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          loading={submitting}
          className="bg-teal-600 text-white hover:bg-teal-700"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
