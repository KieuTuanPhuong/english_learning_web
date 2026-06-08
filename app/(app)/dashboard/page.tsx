"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  useDueAssignments,
  useModules,
  useMyProgress,
  useMySubmissions,
} from "@/lib/hooks";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  RolePlaceholder,
  Skeleton,
} from "@/components/ui";
import { dueLabel, formatScore, parseDecimal, timeAgo } from "@/lib/format";

export default function DashboardPage() {
  const { role } = useAuth();
  if (role === "student") return <StudentDashboard />;
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Teacher overview" />
      <RolePlaceholder feature="Teacher dashboard" />
    </>
  );
}

function StudentDashboard() {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const due = useDueAssignments();
  const progress = useMyProgress();
  const submissions = useMySubmissions();
  const modules = useModules();

  const moduleTitle = (id?: number | null) =>
    modules.data?.find((m) => m.id === id)?.title ?? `Module #${id}`;

  const continueItems = (progress.data ?? [])
    .filter((p) => (parseDecimal(p.completion_percentage) ?? 0) < 100)
    .slice(0, 1);

  const recent = (submissions.data ?? [])
    .slice()
    .sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""))
    .slice(0, 3);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Hi, ${firstName}`}
        subtitle={
          due.isLoading
            ? "Loading your week…"
            : due.items.length
              ? `${due.items.length} thing${due.items.length === 1 ? "" : "s"} due`
              : "You're all caught up"
        }
      />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700">Due soon</h2>
        {due.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : due.isError ? (
          <ErrorState message="Couldn’t load assignments." />
        ) : due.items.length === 0 ? (
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
          due.items.slice(0, 4).map(({ assignment, klass }) => (
            <Link key={assignment.id} href={`/classes/${klass.id}`} className="block">
              <Card accent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{klass.class_name}</p>
                  <p className="text-xs text-zinc-500">{dueLabel(assignment.due_date)}</p>
                </div>
                <span className="text-accent">→</span>
              </Card>
            </Link>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700">Continue learning</h2>
        {progress.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : continueItems.length === 0 ? (
          <EmptyState title="No modules in progress" />
        ) : (
          continueItems.map((p) => {
            const pct = parseDecimal(p.completion_percentage) ?? 0;
            return (
              <Link key={p.id} href={`/modules/${p.module_id}`} className="block">
                <Card className="space-y-2">
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
        <h2 className="text-sm font-semibold text-zinc-700">Recent submissions</h2>
        {submissions.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : recent.length === 0 ? (
          <EmptyState title="No submissions yet" />
        ) : (
          recent.map((s) => (
            <Link key={s.id} href={`/submissions/${s.id}`} className="block">
              <Card className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{s.submission_type} submission</p>
                  <p className="text-xs text-zinc-500">{timeAgo(s.submitted_at)}</p>
                </div>
                {s.auto_score != null ? (
                  <Badge kind="graded">{formatScore(s.auto_score)}</Badge>
                ) : (
                  <Badge kind="submitted">Submitted</Badge>
                )}
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
