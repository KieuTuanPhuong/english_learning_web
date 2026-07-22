"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  useDashboard,
  useClasses,
  useModules,
} from "@/lib/hooks";
import type {
  StudentDashboard,
  TeacherDashboard,
  Assignment,
  Progress,
  Feedback,
  Submission,
  Class,
} from "@/lib/types";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  Skeleton,
  AiTag,
  Button,
} from "@/components/ui";
import { dueLabel, formatScore, parseDecimal, timeAgo } from "@/lib/format";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";

export default function DashboardPage() {
  const { role } = useAuth();
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Couldn’t load dashboard." />;
  }

  const envelope = data;
  if (!envelope) return <EmptyState title="No data" />;

  if (role === "student") {
    return <StudentDashboardComponent d={envelope.data as StudentDashboard} />;
  }

  if (role === "teacher") {
    return <TeacherDashboardComponent d={envelope.data as TeacherDashboard} />;
  }

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview" />
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <p className="text-zinc-500">Welcome to your dashboard.</p>
      </div>
    </>
  );
}

function StudentDashboardComponent({ d }: { d: StudentDashboard }) {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const classes = useClasses();
  const modules = useModules();

  const moduleTitle = (id?: number | null) =>
    modules.data?.find((m) => m.id === id)?.title ?? `Module #${id}`;

  const dueAssignments = d.due_assignments ?? [];
  const inProgressModules = d.in_progress_modules ?? [];
  const recentFeedback = d.recent_feedback ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Hi, ${firstName}`}
        subtitle={
          dueAssignments.length
            ? `${dueAssignments.length} thing${dueAssignments.length === 1 ? "" : "s"} due`
            : "You're all caught up"
        }
      />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700">Due soon</h2>
        {classes.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : dueAssignments.length === 0 ? (
          <EmptyState
            title="Nothing due"
            hint="Browse the module catalog to keep practising."
            action={
              <Link href="/modules" className="text-sm font-medium text-accent">
                Browse modules →
              </Link>
            }
          />
        ) : (
          dueAssignments.slice(0, 4).map((assignment: Assignment) => {
            const klass = classes.data?.find((c) => c.id === assignment.class_id);
            return (
              <Link key={assignment.id} href={`/classes/${assignment.class_id}`} className="block">
                <Card accent className="flex items-center justify-between hover:border-accent transition">
                  <div>
                    <p className="font-medium">{klass?.class_name ?? `Class #${assignment.class_id}`}</p>
                    <p className="text-xs text-zinc-500">{dueLabel(assignment.due_date)}</p>
                  </div>
                  <span className="text-accent">→</span>
                </Card>
              </Link>
            );
          })
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700">Continue learning</h2>
        {modules.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : inProgressModules.length === 0 ? (
          <EmptyState title="No modules in progress" />
        ) : (
          inProgressModules.slice(0, 1).map((p: Progress) => {
            const pct = parseDecimal(p.completion_percentage) ?? 0;
            return (
              <Link key={p.id} href={`/modules/${p.module_id}`} className="block">
                <Card className="space-y-2 hover:border-zinc-300 transition">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{moduleTitle(p.module_id)}</p>
                    <span className="text-sm text-zinc-500">{Math.round(pct)}%</span>
                  </div>
                  <ProgressBar value={pct} />
                </Card>
              </Link>
            );
          })
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700">Recent feedback</h2>
        {recentFeedback.length === 0 ? (
          <EmptyState title="No feedback yet" />
        ) : (
          recentFeedback.map((f: Feedback) => (
            <Link key={f.id} href={`/submissions/${f.submission_id}`} className="block">
              <Card className="flex items-center justify-between hover:border-zinc-300 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-zinc-800">
                      {f.is_ai_generated ? "AI Feedback" : "Teacher Feedback"}
                    </span>
                    {f.is_ai_generated && <AiTag />}
                  </div>
                  <p className="text-xs text-zinc-500">{timeAgo(f.created_at)}</p>
                </div>
                <Badge kind="graded">{formatScore(f.score)}/100</Badge>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}

function TeacherDashboardComponent({ d }: { d: TeacherDashboard }) {
  const [busyClassId, setBusyClassId] = useState<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function onExport(e: React.MouseEvent, classId: number) {
    e.preventDefault();
    e.stopPropagation();
    setBusyClassId(classId);
    setExportError(null);
    try {
      await api.downloadGradeReport(classId);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "Export failed.");
    } finally {
      setBusyClassId(null);
    }
  }

  const classes = d.classes ?? [];
  const recentUngraded = d.recent_ungraded ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Teacher Overview" />

      {exportError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {exportError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex flex-col justify-between p-6">
          <span className="text-sm font-medium text-zinc-500">My Classes</span>
          <span className="mt-2 text-3xl font-bold text-teal-600">{d.class_count}</span>
        </Card>
        <Card className="flex flex-col justify-between p-6">
          <span className="text-sm font-medium text-zinc-500">Enrolled Students</span>
          <span className="mt-2 text-3xl font-bold text-teal-600">{d.enrolled_student_count}</span>
        </Card>
        <Card className="flex flex-col justify-between p-6 bg-rose-50/50 border-rose-100">
          <span className="text-sm font-medium text-rose-800">Ungraded Submissions</span>
          <span className="mt-2 text-3xl font-bold text-rose-600">{d.ungraded_submission_count}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-800">Recent Ungraded Submissions</h2>
          {recentUngraded.length === 0 ? (
            <EmptyState title="All caught up!" hint="No submissions pending grading." />
          ) : (
            <div className="space-y-2">
              {recentUngraded.map((s: Submission) => (
                <Link key={s.id} href={`/submissions/${s.id}`} className="block">
                  <Card className="flex items-center justify-between hover:border-teal-300 transition">
                    <div>
                      <p className="font-medium capitalize">{s.submission_type} submission</p>
                      <p className="text-xs text-zinc-500">{timeAgo(s.submitted_at)}</p>
                    </div>
                    <Badge kind="pending">Pending</Badge>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-zinc-800">My Classes</h2>
          {classes.length === 0 ? (
            <EmptyState title="No classes" hint="Create a class to get started." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {classes.map((c: Class) => (
                <Link key={c.id} href={`/classes/${c.id}`} className="block">
                  <Card className="flex flex-col justify-between h-32 hover:border-teal-300 transition">
                    <div>
                      <p className="font-semibold text-zinc-800 line-clamp-1">{c.class_name}</p>
                      <p className="text-xs text-zinc-500 line-clamp-1">{c.academic_year || "No academic year"}</p>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs font-semibold text-teal-600">View Class →</span>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={busyClassId === c.id}
                        onClick={(e) => onExport(e, c.id)}
                      >
                        Export CSV
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
