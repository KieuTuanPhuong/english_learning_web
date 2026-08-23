"use client";
// Countdown driven entirely by the server's `expires_at` + `server_time`
// (lib/mock-tests.ts:useServerCountdown). The device clock is never trusted.
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRemaining, type TimerPhase } from "@/lib/mock-tests";

const phaseStyles: Record<TimerPhase, string> = {
  normal: "bg-zinc-100 text-zinc-700",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-700 animate-pulse",
  expired: "bg-red-600 text-white",
};

export function SectionTimer({
  remainingMs,
  phase,
}: {
  /** null for the sub-frame before the countdown's first tick lands. */
  remainingMs: number | null;
  phase: TimerPhase;
}) {
  const label =
    phase === "expired"
      ? "Time's up"
      : remainingMs === null
        ? "--:--"
        : formatRemaining(remainingMs);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-sm font-semibold tabular-nums",
        phaseStyles[phase],
      )}
      // Announcing every tick would make the timer unusable with a screen
      // reader; only the threshold changes are worth interrupting for.
      aria-live={phase === "normal" ? "off" : "polite"}
      aria-label={`Time remaining: ${label}`}
    >
      <Clock size={16} aria-hidden />
      {label}
    </div>
  );
}
