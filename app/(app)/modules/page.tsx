"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useModules, useMyProgress } from "@/lib/hooks";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  RolePlaceholder,
  Skeleton,
  TextField,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { parseDecimal } from "@/lib/format";
import type { DifficultyLevel } from "@/lib/types";

const DIFFICULTIES: (DifficultyLevel | "all")[] = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
];

export default function ModulesPage() {
  const { role } = useAuth();
  if (role === "student") return <ModuleCatalog />;
  return (
    <>
      <PageHeader title="Modules" />
      <RolePlaceholder feature="My Modules (teacher)" />
    </>
  );
}

function ModuleCatalog() {
  const modules = useModules();
  const progress = useMyProgress();
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<(typeof DIFFICULTIES)[number]>("all");

  const progressByModule = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of progress.data ?? []) {
      map.set(p.module_id, parseDecimal(p.completion_percentage) ?? 0);
    }
    return map;
  }, [progress.data]);

  const filtered = useMemo(() => {
    return (modules.data ?? []).filter((m) => {
      const matchQ = m.title.toLowerCase().includes(q.toLowerCase());
      const matchD = diff === "all" || m.difficulty_level === diff;
      return matchQ && matchD;
    });
  }, [modules.data, q, diff]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Modules"
        subtitle={modules.data ? `${modules.data.length} modules` : undefined}
      />
      <TextField
        placeholder="Search modules…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDiff(d)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs capitalize",
              diff === d
                ? "border-accent bg-accent/10 text-accent"
                : "border-zinc-300 text-zinc-600",
            )}
          >
            {d}
          </button>
        ))}
      </div>

      {modules.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : modules.isError ? (
        <ErrorState message="Couldn’t load modules." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No modules found" hint="Try a different search or filter." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const pct = progressByModule.get(m.id);
            return (
              <Link key={m.id} href={`/modules/${m.id}`} className="block">
                <Card className="h-full space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{m.title}</p>
                    {m.difficulty_level && (
                      <Badge kind={m.difficulty_level}>{m.difficulty_level}</Badge>
                    )}
                  </div>
                  {m.description && (
                    <p className="line-clamp-2 text-sm text-zinc-500">{m.description}</p>
                  )}
                  {pct != null && <ProgressBar value={pct} />}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
