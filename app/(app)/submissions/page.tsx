"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useMySubmissions } from "@/lib/hooks";
import * as api from "@/lib/api";
import { qk } from "@/lib/query-keys";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  RolePlaceholder,
  Skeleton,
  Tabs,
} from "@/components/ui";
import { formatScore, timeAgo } from "@/lib/format";

type Filter = "all" | "graded" | "awaiting";

export default function SubmissionsPage() {
  const { role } = useAuth();
  if (role === "student") return <MySubmissions />;
  return (
    <>
      <PageHeader title="Submissions" />
      <RolePlaceholder feature="Submissions inbox (teacher)" />
    </>
  );
}

function MySubmissions() {
  const submissions = useMySubmissions();
  const list = submissions.data ?? [];

  const feedbackQueries = useQueries({
    queries: list.map((s) => ({
      queryKey: qk.submissionFeedback(s.id),
      queryFn: () => api.listSubmissionFeedback(s.id),
      enabled: submissions.isSuccess,
    })),
  });

  const feedbackStamp = feedbackQueries.map((q) => q.dataUpdatedAt).join(",");
  const gradedById = useMemo(() => {
    const map = new Map<number, { graded: boolean; score: string | null }>();
    list.forEach((s, i) => {
      const fb = feedbackQueries[i]?.data ?? [];
      const latest = fb[fb.length - 1];
      map.set(s.id, { graded: fb.length > 0, score: latest?.score ?? null });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, feedbackStamp]);

  const [filter, setFilter] = useState<Filter>("all");
  const filtered = list.filter((s) => {
    if (filter === "all") return true;
    const graded = gradedById.get(s.id)?.graded ?? false;
    return filter === "graded" ? graded : !graded;
  });

  return (
    <div className="space-y-4">
      <PageHeader title="My submissions" />
      <Tabs
        value={filter}
        onChange={(v) => setFilter(v as Filter)}
        tabs={[
          { value: "all", label: "All" },
          { value: "graded", label: "Graded" },
          { value: "awaiting", label: "Awaiting" },
        ]}
      />
      {submissions.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : submissions.isError ? (
        <ErrorState message="Couldn’t load submissions." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No submissions" hint="Complete an exercise to see it here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const g = gradedById.get(s.id);
            return (
              <Link key={s.id} href={`/submissions/${s.id}`} className="block">
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">
                      {s.submission_type} submission
                    </p>
                    <p className="text-xs text-zinc-500">{timeAgo(s.submitted_at)}</p>
                  </div>
                  {g?.graded ? (
                    <Badge kind="graded">{formatScore(g.score)}</Badge>
                  ) : (
                    <Badge kind="ungraded">Awaiting</Badge>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
