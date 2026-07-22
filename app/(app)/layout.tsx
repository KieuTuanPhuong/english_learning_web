"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout";
import { FullScreenLoader } from "@/components/ui";
import { useRealtimeNotifications } from "@/lib/hooks";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
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
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  useRealtimeNotifications();
  return <AppShell>{children}</AppShell>;
}
