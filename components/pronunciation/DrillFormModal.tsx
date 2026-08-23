"use client";
// Teacher/admin drill CRUD via the existing Modal. Validated with
// drillFormSchema.safeParse in the submit handler (doc 04 §3.3/§4.6).
import { useState } from "react";
import { Button, Modal, TextField } from "@/components/ui";
import { ApiError } from "@/lib/api";
import {
  useCreatePronunciationDrill,
  useModules,
  useUpdatePronunciationDrill,
} from "@/lib/hooks";
import { drillFormSchema } from "@/lib/pronunciation";
import type {
  DifficultyLevel,
  DrillType,
  PronunciationDrill,
  PronunciationDrillRequest,
} from "@/lib/types";

interface FormState {
  target_text: string;
  contrast_text: string;
  phoneme_hint: string;
  drill_type: DrillType;
  difficulty_level: string;
  module_id: string;
}

const EMPTY: FormState = {
  target_text: "",
  contrast_text: "",
  phoneme_hint: "",
  drill_type: "word",
  difficulty_level: "",
  module_id: "",
};

export function DrillFormModal({
  open,
  onClose,
  drill,
}: {
  open: boolean;
  onClose: () => void;
  drill: PronunciationDrill | null;
}) {
  // Remount the inner form per opened drill (key) so its useState initializes
  // fresh from props — no effect, no render-phase setState.
  return (
    <Modal open={open} onClose={onClose} title={drill ? "Edit drill" : "New drill"}>
      {open && <DrillForm key={drill?.id ?? "new"} drill={drill} onClose={onClose} />}
    </Modal>
  );
}

function initialForm(drill: PronunciationDrill | null): FormState {
  return drill
    ? {
        target_text: drill.target_text,
        contrast_text: drill.contrast_text ?? "",
        phoneme_hint: drill.phoneme_hint ?? "",
        drill_type: drill.drill_type,
        difficulty_level: drill.difficulty_level ?? "",
        module_id: drill.module_id != null ? String(drill.module_id) : "",
      }
    : EMPTY;
}

function DrillForm({
  drill,
  onClose,
}: {
  drill: PronunciationDrill | null;
  onClose: () => void;
}) {
  const isEdit = !!drill;
  const modules = useModules();
  const create = useCreatePronunciationDrill();
  const update = useUpdatePronunciationDrill(drill?.id ?? NaN);
  const [form, setForm] = useState<FormState>(() => initialForm(drill));
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    setFieldError(null);
    setError(null);
    const parsed = drillFormSchema.safeParse({
      target_text: form.target_text,
      contrast_text: form.contrast_text || undefined,
      phoneme_hint: form.phoneme_hint || undefined,
      drill_type: form.drill_type,
      difficulty_level: form.difficulty_level || undefined,
      module_id: form.module_id ? Number(form.module_id) : undefined,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    const body: PronunciationDrillRequest = {
      target_text: parsed.data.target_text,
      contrast_text: parsed.data.contrast_text || null,
      phoneme_hint: parsed.data.phoneme_hint || null,
      drill_type: parsed.data.drill_type,
      difficulty_level: (parsed.data.difficulty_level ?? null) as
        | DifficultyLevel
        | null,
      module_id: parsed.data.module_id ?? null,
    };
    try {
      if (isEdit) await update.mutateAsync(body);
      else await create.mutateAsync(body);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save drill.");
    }
  };

  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="block text-sm font-medium text-zinc-700">Type</span>
          <select
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm"
            value={form.drill_type}
            onChange={(e) => set("drill_type", e.target.value as DrillType)}
          >
            <option value="word">Word</option>
            <option value="sentence">Sentence</option>
            <option value="minimal_pair">Minimal pair</option>
          </select>
        </label>

        <TextField
          label="Target text"
          placeholder="thorough"
          value={form.target_text}
          onChange={(e) => set("target_text", e.target.value)}
        />

        {form.drill_type === "minimal_pair" && (
          <TextField
            label="Contrast text"
            placeholder="sheep (the word NOT to say)"
            value={form.contrast_text}
            onChange={(e) => set("contrast_text", e.target.value)}
          />
        )}

        <TextField
          label="Phoneme hint (IPA, optional)"
          placeholder="/ˈθʌr.oʊ/"
          value={form.phoneme_hint}
          onChange={(e) => set("phoneme_hint", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="block text-sm font-medium text-zinc-700">
              Difficulty
            </span>
            <select
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm"
              value={form.difficulty_level}
              onChange={(e) => set("difficulty_level", e.target.value)}
            >
              <option value="">None</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="block text-sm font-medium text-zinc-700">
              Module
            </span>
            <select
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm"
              value={form.module_id}
              onChange={(e) => set("module_id", e.target.value)}
            >
              <option value="">None</option>
              {(modules.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        {fieldError && (
          <p className="text-sm font-medium text-red-600">{fieldError}</p>
        )}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-teal-600 text-white hover:bg-teal-700"
            loading={create.isPending || update.isPending}
            onClick={onSubmit}
          >
            {isEdit ? "Save changes" : "Create drill"}
          </Button>
        </div>
    </div>
  );
}
