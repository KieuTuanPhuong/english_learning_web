"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  useClass,
  useClassAssignments,
  useClassLessonPlans,
  useClassStudents,
} from "@/lib/hooks";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  RolePlaceholder,
  Skeleton,
  Tabs,
} from "@/components/ui";
import { dateLabel, dueLabel } from "@/lib/format";

export default function ClassDetailPage() {
  const { role } = useAuth();
  if (role === "student") return <StudentClassDetail />;
  return <RolePlaceholder feature="Class detail (teacher)" />;
}

function StudentClassDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const klass = useClass(id);
  const [tab, setTab] = useState("assignments");
  const assignments = useClassAssignments(id);
  const lessonPlans = useClassLessonPlans(id);
  const students = useClassStudents(id);

  return (
    <div className="space-y-4">
      <Link
        href="/classes"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ChevronLeft size={16} /> My classes
      </Link>

      {klass.isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : klass.isError || !klass.data ? (
        <ErrorState message="Couldn’t load class." />
      ) : (
        <div>
          <h1 className="text-2xl font-bold">{klass.data.class_name}</h1>
          {klass.data.academic_year && (
            <p className="text-sm text-zinc-500">AY {klass.data.academic_year}</p>
          )}
        </div>
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "assignments", label: "Assignments" },
          { value: "plans", label: "Lesson plans" },
          { value: "roster", label: "Roster" },
        ]}
      />

      {tab === "assignments" && (
        <ListSection q={assignments} empty="No assignments yet">
          {(a) => (
            <Card key={a.id} className="flex items-center justify-between">
              <p className="text-sm">Exercise #{a.exercise_id ?? "—"}</p>
              <Badge kind="ungraded">{dueLabel(a.due_date)}</Badge>
            </Card>
          )}
        </ListSection>
      )}

      {tab === "plans" && (
        <ListSection q={lessonPlans} empty="No lesson plans">
          {(p) => (
            <Card key={p.id} className="space-y-1">
              <p className="font-medium">{p.title}</p>
              {(p.start_date || p.end_date) && (
                <p className="text-xs text-zinc-500">
                  {dateLabel(p.start_date)} – {dateLabel(p.end_date)}
                </p>
              )}
              {p.objectives && (
                <p className="text-sm text-zinc-600">{p.objectives}</p>
              )}
            </Card>
          )}
        </ListSection>
      )}

      {tab === "roster" && (
        <ListSection q={students} empty="No students enrolled">
          {(u) => (
            <Card key={u.id} className="flex items-center gap-3">
              <Avatar name={u.full_name} size={28} />
              <div>
                <p className="text-sm font-medium">{u.full_name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
            </Card>
          )}
        </ListSection>
      )}
    </div>
  );
}

function ListSection<T>({
  q,
  empty,
  children,
}: {
  q: { isLoading: boolean; isError: boolean; data?: T[] };
  empty: string;
  children: (item: T) => ReactNode;
}) {
  if (q.isLoading) return <Skeleton className="h-24 w-full" />;
  if (q.isError) return <ErrorState />;
  const data = q.data ?? [];
  if (data.length === 0) return <EmptyState title={empty} />;
  return <div className="space-y-2">{data.map(children)}</div>;
}
