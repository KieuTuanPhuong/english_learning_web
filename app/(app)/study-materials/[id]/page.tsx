"use client";
import { useState, use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth-context";
import {
  useStudyMaterial,
  useUpdateStudyMaterial,
  useDeleteStudyMaterial,
  useClasses,
} from "@/lib/hooks";
import {
  Badge,
  Card,
  ErrorState,
  Skeleton,
  Button,
  Modal,
  TextField,
  TextArea,
} from "@/components/ui";
import { dateLabel } from "@/lib/format";
import { ApiError } from "@/lib/api";

interface EditMaterialForm {
  title: string;
  file_url: string;
  description: string;
  class_id?: string;
}

export default function StudyMaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params per Next.js 16 guidelines
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();

  const { role } = useAuth();
  const isAdmin = role === "admin";

  const { data: material, isLoading, isError } = useStudyMaterial(id);
  const classes = useClasses();
  const updateMaterial = useUpdateStudyMaterial(id);
  const deleteMaterial = useDeleteStudyMaterial();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditMaterialForm>({
    values: material
      ? {
          title: material.title,
          file_url: material.file_url,
          description: material.description ?? "",
          class_id: material.class_id ? String(material.class_id) : "",
        }
      : undefined,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !material) return <ErrorState message="Study material not found." />;

  const classObj = classes.data?.find((c) => c.id === material.class_id);

  const onEditSubmit = async (data: EditMaterialForm) => {
    setFormError(null);
    try {
      await updateMaterial.mutateAsync({
        title: data.title,
        file_url: data.file_url,
        description: data.description || undefined,
        class_id: data.class_id ? Number(data.class_id) : null,
      });
      setIsEditOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to update study material.");
    }
  };

  const onDeleteConfirm = async () => {
    setDeleteError(null);
    try {
      await deleteMaterial.mutateAsync(id);
      setIsDeleteOpen(false);
      router.push("/study-materials");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete study material.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/study-materials"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ChevronLeft size={16} /> Back to materials
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {classObj && <Badge kind="student">{classObj.class_name}</Badge>}
          <Badge kind="active">Document</Badge>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">{material.title}</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Uploaded on {dateLabel(material.created_at)}
          </p>
        </div>

        {material.description && (
          <div>
            <span className="text-xs font-semibold text-zinc-400 block mb-1">
              Description
            </span>
            <p className="whitespace-pre-wrap text-sm text-zinc-700">
              {material.description}
            </p>
          </div>
        )}

        <div className="pt-2">
          <a
            href={material.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-4 text-sm font-medium hover:opacity-90 transition"
          >
            Open Document in New Tab
          </a>
        </div>
      </Card>

      {/* Admin edit modal */}
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Study Material">
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
          {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}

          <TextField
            label="Title"
            error={errors.title?.message}
            {...register("title", { required: "Title is required" })}
          />

          <TextField
            label="File URL"
            error={errors.file_url?.message}
            {...register("file_url", { required: "File URL is required" })}
          />

          <TextArea
            label="Description"
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
            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              type="submit"
              loading={updateMaterial.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Study Material">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            Are you sure you want to permanently delete this study material? This action cannot be undone.
          </p>
          {deleteError && <p className="text-sm text-red-600 font-medium">{deleteError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMaterial.isPending}
              onClick={onDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
