"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useClasses } from "@/lib/hooks";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  RolePlaceholder,
  Skeleton,
} from "@/components/ui";

export default function ClassesPage() {
  const { role } = useAuth();
  if (role === "student") return <MyClasses />;
  return (
    <>
      <PageHeader title="My Classes" />
      <RolePlaceholder feature="My Classes (teacher)" />
    </>
  );
}

function MyClasses() {
  const classes = useClasses();
  const list = classes.data ?? [];
  return (
    <div className="space-y-4">
      <PageHeader
        title="My classes"
        subtitle={classes.data ? `${list.length} enrolled` : undefined}
      />
      {classes.isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : classes.isError ? (
        <ErrorState message="Couldn’t load classes." />
      ) : list.length === 0 ? (
        <EmptyState
          title="No classes yet"
          hint="Your teacher will enrol you, or browse modules to self-study."
          action={
            <Link href="/modules" className="text-sm font-medium text-accent">
              Browse modules →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((c) => (
            <Link key={c.id} href={`/classes/${c.id}`} className="block">
              <Card className="space-y-1">
                <p className="font-medium">{c.class_name}</p>
                {c.academic_year && (
                  <p className="text-xs text-zinc-500">AY {c.academic_year}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
