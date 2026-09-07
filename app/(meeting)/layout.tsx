"use client";
// Full-bleed layout for the live meeting room, copied from app/(test)/layout.tsx
// and for the same reasons: no AppShell (no nav chrome around a video call) and
// no useRealtimeNotifications (its broad invalidations would churn queries while
// a call holds camera/mic). Only the auth guard is replicated.
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { FullScreenLoader } from "@/components/ui";

export default function MeetingGroupLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <FullScreenLoader />
      </div>
    );
  }
  if (!user) return null;

  // Out of flow (fixed) and exactly one dynamic viewport tall: the root layout
  // puts `h-full` on <html> and `min-h-full` on <body>, so an in-flow child
  // would still let the document scroll by the mobile browser-chrome delta.
  // Fixed + h-dvh + clipping means the page can never scroll and the control
  // bar can never hide behind the address bar.
  return (
    <div className="fixed inset-x-0 top-0 h-dvh overflow-hidden bg-zinc-50">
      {children}
    </div>
  );
}
