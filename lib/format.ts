// Display formatters. Decimals from the API are strings; dates are ISO strings.
import { format, formatDistanceToNow, isPast } from "date-fns";

export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function parseDecimal(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatScore(value: string | null | undefined): string {
  const n = parseDecimal(value);
  return n == null ? "—" : String(Math.round(n));
}

export function dueLabel(due: string | null | undefined): string {
  if (!due) return "No due date";
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return "No due date";
  return `${isPast(d) ? "Overdue · " : "Due "}${format(d, "EEE MMM d")}`;
}

export function dateLabel(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : format(d, "MMM d, yyyy");
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : formatDistanceToNow(d, { addSuffix: true });
}

export function submissionStatusLabel(s: string): string {
  const map: Record<string, string> = { pending: "Pending", graded: "Graded", ai_graded: "AI graded" };
  return map[s] ?? s;
}

// Seconds -> "07:12" (or "1:07:12" past an hour) for the meeting clock.
export function durationLabel(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// "2026-08-25T14:30:00Z" -> "Aug 25, 14:30" for a meeting booking.
export function dateTimeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "MMM d, HH:mm");
}

// "band_5_6" -> "Band 5–6" (feature 06 catalog grading).
export function bandLabel(band: string): string {
  const m = band.match(/^band_(\d+)_(\d+)$/);
  return m ? `Band ${m[1]}–${m[2]}` : band;
}

