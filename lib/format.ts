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
