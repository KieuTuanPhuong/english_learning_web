"use client";
import { Check, CloudOff, Loader2 } from "lucide-react";
import type { SaveStatus } from "@/lib/mock-tests";

/** Autosave state. "error" is phrased as retrying rather than as data loss:
 *  the debounced saver keeps the pending draft and the next change re-sends it. */
export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const content = {
    saving: {
      icon: <Loader2 size={14} className="animate-spin" aria-hidden />,
      label: "Saving…",
      className: "text-zinc-500",
    },
    saved: {
      icon: <Check size={14} aria-hidden />,
      label: "Saved",
      className: "text-emerald-600",
    },
    error: {
      icon: <CloudOff size={14} aria-hidden />,
      label: "Offline — retrying",
      className: "text-amber-600",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${content.className}`}
      aria-live="polite"
    >
      {content.icon}
      {content.label}
    </span>
  );
}
