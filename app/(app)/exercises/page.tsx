"use client";
// Practice catalog (/exercises): every student browses the whole exercise
// library and picks by topic, band, skill or keyword. Filtering runs
// server-side (GET /api/exercises/?band=&topic=&type=&q=) rather than in the
// browser, since the catalog grows past what is sensible to ship in one go;
// the facet counts come back from the same filters so each chip can say how
// much sits behind it.
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useExerciseCatalog, useExerciseFacets } from "@/lib/hooks";
import { bandLabel } from "@/lib/format";
import {
  BAND_LEVELS,
  TOPICS,
  type BandLevel,
  type ExerciseCatalogFilters,
  type SkillType,
  type Topic,
} from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FilterChips,
  PageHeader,
  Skeleton,
  TextField,
} from "@/components/ui";

const ANY = "all" as const;
type Any = typeof ANY;

const BANDS: (BandLevel | Any)[] = [ANY, ...BAND_LEVELS];
const TOPIC_CHIPS: (Topic | Any)[] = [ANY, ...TOPICS];
const TYPES: (SkillType | Any)[] = [
  ANY,
  "writing",
  "speaking",
  "reading",
  "listening",
  "quiz",
];

export default function ExerciseCatalogPage() {
  const [band, setBand] = useState<BandLevel | Any>(ANY);
  const [topic, setTopic] = useState<Topic | Any>(ANY);
  const [type, setType] = useState<SkillType | Any>(ANY);
  const [search, setSearch] = useState("");

  const filters: ExerciseCatalogFilters = useMemo(
    () => ({
      ...(band !== ANY && { band }),
      ...(topic !== ANY && { topic }),
      ...(type !== ANY && { type }),
      ...(search.trim() && { q: search.trim() }),
    }),
    [band, topic, type, search],
  );

  const exercises = useExerciseCatalog(filters);
  const facets = useExerciseFacets(filters);
  const rows = exercises.data ?? [];
  const hasFilters =
    band !== ANY || topic !== ANY || type !== ANY || Boolean(search.trim());

  const clear = () => {
    setBand(ANY);
    setTopic(ANY);
    setType(ANY);
    setSearch("");
  };

  // Counts label the concrete choices only. The "any" chip deliberately shows
  // none: summing a dimension would miss exercises left untagged in that
  // dimension, so the number would contradict the header's match total.
  const bandCount = (b: BandLevel | Any) =>
    b === ANY ? undefined : facets.data?.bands?.[b] ?? 0;
  const topicCount = (t: Topic | Any) =>
    t === ANY ? undefined : facets.data?.topics?.[t] ?? 0;
  const typeCount = (t: SkillType | Any) =>
    t === ANY ? undefined : facets.data?.types?.[t] ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Practice"
        subtitle={
          facets.data
            ? `${facets.data.total} exercise${facets.data.total === 1 ? "" : "s"} match`
            : undefined
        }
        action={
          hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clear}>
              <X size={14} />
              Clear filters
            </Button>
          ) : undefined
        }
      />

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-zinc-400"
        />
        <TextField
          placeholder="Search by title or prompt…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        <FilterLabel>Band</FilterLabel>
        <FilterChips
          options={BANDS}
          value={band}
          onChange={setBand}
          label={(b) => (b === ANY ? "any band" : bandLabel(b))}
          count={bandCount}
        />
        <FilterLabel>Topic</FilterLabel>
        <FilterChips
          options={TOPIC_CHIPS}
          value={topic}
          onChange={setTopic}
          label={(t) => (t === ANY ? "any topic" : t)}
          count={topicCount}
        />
        <FilterLabel>Skill</FilterLabel>
        <FilterChips
          options={TYPES}
          value={type}
          onChange={setType}
          label={(t) => (t === ANY ? "any skill" : t)}
          count={typeCount}
        />
      </div>

      {exercises.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : exercises.isError ? (
        <ErrorState message="Couldn’t load the practice catalog." />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nothing matches those filters"
          hint="Try a wider band or a different topic."
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={clear}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((ex) => (
            <Link key={ex.id} href={`/exercises/${ex.id}`} className="block">
              <Card className="flex h-full flex-col gap-2">
                <p className="font-medium leading-snug">{ex.title}</p>
                <div className="flex flex-wrap gap-1">
                  {ex.band && <Badge kind="band">{bandLabel(ex.band)}</Badge>}
                  {ex.topic && <Badge kind={ex.topic}>{ex.topic}</Badge>}
                  <Badge kind={ex.exercise_type}>{ex.exercise_type}</Badge>
                  {ex.question_count > 0 && (
                    <Badge className="bg-zinc-100 text-zinc-600">
                      {ex.question_count} Qs
                    </Badge>
                  )}
                </div>
                <p className="mt-auto text-xs text-zinc-500">
                  {ex.module_title ?? "Standalone practice"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterLabel({ children }: { children: string }) {
  return (
    <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
      {children}
    </p>
  );
}
