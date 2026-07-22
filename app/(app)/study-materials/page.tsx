"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth-context";
import {
  useStudyMaterials,
  useCreateStudyMaterial,
  useClasses,
} from "@/lib/hooks";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  Button,
  Modal,
  TextField,
  TextArea,
} from "@/components/ui";
import { dateLabel } from "@/lib/format";
import { ApiError } from "@/lib/api";

interface CreateMaterialForm {
  title: string;
  file_url: string;
  description: string;
  class_id?: string;
}

export default function StudyMaterialsPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const { data: materials, isLoading, isError } = useStudyMaterials();
  const classes = useClasses();
  const createMaterial = useCreateStudyMaterial();

  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMaterialForm>({
    defaultValues: { title: "", file_url: "", description: "", class_id: "" },
  });

  const onSubmit = async (data: CreateMaterialForm) => {
    setFormError(null);
    try {
      await createMaterial.mutateAsync({
        title: data.title,
        file_url: data.file_url,
        description: data.description || undefined,
        class_id: data.class_id ? Number(data.class_id) : null,
      });
      reset();
      setIsOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to create study material.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Study Materials" subtitle="Resource library" />
        {isAdmin && (
          <Button
            className="bg-amber-600 text-white hover:bg-amber-700"
            onClick={() => setIsOpen(true)}
          >
            New material
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError ? (
        <ErrorState message="Couldn’t load study materials." />
      ) : (materials ?? []).length === 0 ? (
        <EmptyState
          title="No study materials"
          hint={isAdmin ? "Create your first document." : "Your teacher has not uploaded any documents yet."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {(materials ?? []).map((m) => {
            const classObj = classes.data?.find((c) => c.id === m.class_id);
            return (
              <Card
                key={m.id}
                className="flex flex-col justify-between h-44 hover:border-zinc-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-zinc-800 line-clamp-1">{m.title}</h3>
                    {classObj && <Badge kind="student">{classObj.class_name}</Badge>}
                  </div>
                  <p className="text-sm text-zinc-500 line-clamp-2 mt-1">
                    {m.description || "No description provided."}
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Added {dateLabel(m.created_at)}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href={`/study-materials/${m.id}`}
                    className="text-xs font-semibold text-accent"
                  >
                    View Details →
                  </Link>
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
                  >
                    Open Document
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Admin create modal */}
      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="New Study Material">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}

          <TextField
            label="Title"
            placeholder="e.g. TOEFL Essential Vocabulary"
            error={errors.title?.message}
            {...register("title", { required: "Title is required" })}
          />

          <TextField
            label="File URL"
            placeholder="https://example.com/vocab.pdf"
            error={errors.file_url?.message}
            {...register("file_url", { required: "File URL is required" })}
          />

          <TextArea
            label="Description"
            placeholder="A short overview of what this document covers..."
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />

          <label className="block space-y-1">
            <span className="block text-sm font-medium text-zinc-700">Class Scope (Optional)</span>
            <select
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              {...register("class_id")}
            >
              <option value="">Public to all classes</option>
              {classes.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              type="submit"
              loading={createMaterial.isPending}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
