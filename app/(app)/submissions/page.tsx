"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useMySubmissions, useSubmissionsInbox, useClasses } from "@/lib/hooks";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  Tabs,
  AiTag,
  Button,
} from "@/components/ui";
import { formatScore, timeAgo, submissionStatusLabel } from "@/lib/format";

type Filter = "all" | "pending" | "graded";

export default function SubmissionsPage() {
  const { role } = useAuth();
  if (role === "student") return <MySubmissions />;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <TeacherInbox />
    </Suspense>
  );
}

function MySubmissions() {
  const submissions = useMySubmissions();
  const list = submissions.data ?? [];

  const [filter, setFilter] = useState<Filter>("all");
  const filtered = list.filter((s) => {
    if (filter === "all") return true;
    if (filter === "graded") return s.status === "graded" || s.status === "ai_graded";
    return s.status === "pending";
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
          { value: "pending", label: "Awaiting" },
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
            return (
              <Link key={s.id} href={`/submissions/${s.id}`} className="block">
                <Card className="flex items-center justify-between hover:border-zinc-300 transition">
                  <div>
                    <p className="font-medium capitalize">
                      {s.submission_type} submission
                    </p>
                    <p className="text-xs text-zinc-500">{timeAgo(s.submitted_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge kind={s.status}>{submissionStatusLabel(s.status)}</Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeacherInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "";
  const classIdStr = searchParams.get("class_id");
  const classId = classIdStr ? Number(classIdStr) : undefined;

  const classes = useClasses();
  const { data, isLoading, isError } = useSubmissionsInbox({
    status: status || undefined,
    class_id: classId,
  });

  const [busyExport, setBusyExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function onExport() {
    if (classId == null) return;
    setBusyExport(true);
    setExportError(null);
    try {
      await api.downloadGradeReport(classId);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "Export failed.");
    } finally {
      setBusyExport(false);
    }
  }

  function setFilter(newStatus: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus) params.set("status", newStatus);
    else params.delete("status");
    router.push(`/submissions?${params.toString()}`);
  }

  function setClassFilter(newClassId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newClassId) params.set("class_id", newClassId);
    else params.delete("class_id");
    router.push(`/submissions?${params.toString()}`);
  }

  const list = data ?? [];

  return (
    <div className="space-y-4">
      {exportError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {exportError}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Submissions Inbox" subtitle="Manage student work" />
        {classId != null && (
          <Button variant="outline" size="sm" loading={busyExport} onClick={onExport}>
            Export CSV
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <select
            value={classIdStr ?? ""}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          >
            <option value="">All Classes</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name}
              </option>
            ))}
          </select>
        </div>

        <Tabs
          value={status || "all"}
          onChange={(v) => setFilter(v === "all" ? "" : v)}
          tabs={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "graded", label: "Graded" },
            { value: "ai_graded", label: "AI Graded" },
          ]}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : isError ? (
        <ErrorState message="Couldn’t load submissions." />
      ) : list.length === 0 ? (
        <EmptyState title="No submissions" hint="Try changing your filters." />
      ) : (
        <div className="space-y-2">
          {list.map((row) => (
            <Link key={row.id} href={`/submissions/${row.id}`} className="block">
              <Card className="flex items-center justify-between hover:border-teal-300 transition">
                <div className="space-y-1">
                  <p className="font-semibold text-zinc-800">{row.student_name}</p>
                  <p className="text-xs text-zinc-500 capitalize">
                    {row.submission_type} practice • Exercise #{row.exercise_id} • {timeAgo(row.submitted_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {row.latest_score != null && (
                    <span className="text-sm font-semibold text-zinc-700">
                      Score: {formatScore(row.latest_score)}/100
                    </span>
                  )}
                  {row.grading_source === "ai" && <AiTag />}
                  <Badge kind={row.status}>{submissionStatusLabel(row.status)}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
