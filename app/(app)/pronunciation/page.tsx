"use client";
// Practice hub: drills grouped by difficulty, filterable; teacher/admin CRUD.
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import {
  useDeletePronunciationDrill,
  useMyPronunciationAttempts,
  usePronunciationDrills,
} from "@/lib/hooks";
import type { PronunciationDrill } from "@/lib/types";
import {
  DrillFilters,
  type DrillFilterState,
} from "@/components/pronunciation/DrillFilters";
import { DrillCard } from "@/components/pronunciation/DrillCard";
import { DrillFormModal } from "@/components/pronunciation/DrillFormModal";

const GROUP_ORDER = ["beginner", "intermediate", "advanced", "other"];

export default function PronunciationHubPage() {
  const { role } = useAuth();
  const canManage = role === "teacher" || role === "admin";
  const [filters, setFilters] = useState<DrillFilterState>({});
  const drills = usePronunciationDrills(filters);
  const myAttempts = useMyPronunciationAttempts();
  const del = useDeletePronunciationDrill();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PronunciationDrill | null>(null);

  const bestByDrill = useMemo(() => {
    const map = new Map<number, number>();
    for (const a of myAttempts.data ?? []) {
      if (a.overall_score == null) continue;
      const s = Number(a.overall_score);
      const prev = map.get(a.drill_id);
      if (prev == null || s > prev) map.set(a.drill_id, s);
    }
    return map;
  }, [myAttempts.data]);

  const grouped = useMemo(() => {
    const g = new Map<string, PronunciationDrill[]>();
    for (const d of drills.data ?? []) {
      const key = d.difficulty_level ?? "other";
      const arr = g.get(key) ?? [];
      arr.push(d);
      g.set(key, arr);
    }
    return g;
  }, [drills.data]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pronunciation practice"
        subtitle="Record, score, and retry — word, sentence, and minimal-pair drills."
        action={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus size={16} /> New drill
            </Button>
          ) : undefined
        }
      />

      <DrillFilters value={filters} onChange={setFilters} />

      {drills.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : drills.isError ? (
        <ErrorState message="Couldn’t load drills." />
      ) : (drills.data ?? []).length === 0 ? (
        <EmptyState
          title="No drills yet"
          hint={canManage ? "Create the first drill." : "Check back soon."}
        />
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.filter((k) => grouped.has(k)).map((level) => (
            <section key={level} className="space-y-2">
              <h2 className="text-sm font-semibold capitalize text-zinc-600">
                {level}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.get(level)!.map((d) => (
                  <DrillCard
                    key={d.id}
                    drill={d}
                    bestScore={bestByDrill.get(d.id) ?? null}
                    canManage={canManage}
                    onEdit={() => {
                      setEditing(d);
                      setModalOpen(true);
                    }}
                    onDelete={() => {
                      if (window.confirm("Delete this drill?")) del.mutate(d.id);
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {canManage && (
        <DrillFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          drill={editing}
        />
      )}
    </div>
  );
}
