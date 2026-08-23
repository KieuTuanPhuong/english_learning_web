"use client";
// Full-bleed layout for the test runner. Route groups do not affect URLs, so
// this exists purely to opt the runner out of app/(app)/layout.tsx.
//
// Deliberately absent: AppShell (no nav to wander off into mid-exam) and
// useRealtimeNotifications (it invalidates dashboard/class queries the runner
// never renders, and a background event should not disturb a timed section).
// Only the auth guard is replicated.
//
// Honest scope: this is a focus aid, not proctoring — no tab-switch detection,
// no copy-paste blocking.
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { FullScreenLoader } from "@/components/ui";

export default function TestGroupLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FullScreenLoader />
      </div>
    );
  }
  if (!user) return null;

  return <div className="min-h-screen bg-zinc-50">{children}</div>;
}
