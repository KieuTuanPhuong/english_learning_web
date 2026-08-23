"use client";
import { cn } from "@/lib/cn";
import { useModules } from "@/lib/hooks";
import type { DifficultyLevel, DrillType } from "@/lib/types";

export interface DrillFilterState {
  drill_type?: DrillType;
  difficulty?: DifficultyLevel;
  module_id?: number;
}

const TYPES: { value: DrillType; label: string }[] = [
  { value: "word", label: "Word" },
  { value: "sentence", label: "Sentence" },
  { value: "minimal_pair", label: "Minimal pair" },
];
const DIFFICULTIES: DifficultyLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];

export function DrillFilters({
  value,
  onChange,
}: {
  value: DrillFilterState;
  onChange: (v: DrillFilterState) => void;
}) {
  const modules = useModules();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() =>
            onChange({
              ...value,
              drill_type: value.drill_type === t.value ? undefined : t.value,
            })
          }
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition",
            value.drill_type === t.value
              ? "border-teal-500 bg-teal-50 text-teal-700"
              : "border-zinc-300 text-zinc-600 hover:bg-zinc-50",
          )}
        >
          {t.label}
        </button>
      ))}
      <select
        className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700"
        value={value.difficulty ?? ""}
        onChange={(e) =>
          onChange({
            ...value,
            difficulty: (e.target.value || undefined) as
              | DifficultyLevel
              | undefined,
          })
        }
      >
        <option value="">All levels</option>
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d} className="capitalize">
            {d}
          </option>
        ))}
      </select>
      <select
        className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700"
        value={value.module_id ?? ""}
        onChange={(e) =>
          onChange({
            ...value,
            module_id: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      >
        <option value="">All modules</option>
        {(modules.data ?? []).map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>
    </div>
  );
}
