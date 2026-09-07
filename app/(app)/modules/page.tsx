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
  FilterChips,
  PageHeader,
  ProgressBar,
  RolePlaceholder,
  Skeleton,
  TextField,
} from "@/components/ui";
import { bandLabel, parseDecimal } from "@/lib/format";
import { BAND_LEVELS, TOPICS, type BandLevel, type DifficultyLevel, type Topic } from "@/lib/types";

const DIFFICULTIES: (DifficultyLevel | "all")[] = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
];

const BANDS: (BandLevel | "all")[] = ["all", ...BAND_LEVELS];
const TOPIC_CHIPS: (Topic | "all")[] = ["all", ...TOPICS];

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
  const [band, setBand] = useState<(typeof BANDS)[number]>("all");
  const [topic, setTopic] = useState<(typeof TOPIC_CHIPS)[number]>("all");

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
      const matchB = band === "all" || m.band === band;
      const matchT = topic === "all" || m.topic === topic;
      return matchQ && matchD && matchB && matchT;
    });
  }, [modules.data, q, diff, band, topic]);

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
      <FilterChips options={DIFFICULTIES} value={diff} onChange={setDiff} label={(d) => d} />
      <FilterChips
        options={BANDS}
        value={band}
        onChange={setBand}
        label={(b) => (b === "all" ? "all bands" : bandLabel(b))}
      />
      <FilterChips
        options={TOPIC_CHIPS}
        value={topic}
        onChange={setTopic}
        label={(t) => (t === "all" ? "all topics" : t)}
      />

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
                  {(m.band || m.topic) && (
                    <div className="flex flex-wrap gap-1">
                      {m.band && <Badge kind="band">{bandLabel(m.band)}</Badge>}
                      {m.topic && <Badge kind={m.topic}>{m.topic}</Badge>}
                    </div>
                  )}
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
