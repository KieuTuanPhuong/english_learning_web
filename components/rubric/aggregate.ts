// Client-side aggregation PREVIEW only — the server value is authoritative
// (backend doc 02 NFR3). These mirror RubricTemplate.aggregate()/normalize()
// exactly so the displayed band never silently diverges from what the server
// will compute. Unit-test against backend doc 02 §5 step 7 table cases.
import type { RubricTemplate } from "@/lib/types";

/** Native-scale overall from a complete list of criterion values. */
export function aggregatePreview(t: RubricTemplate, values: number[]): number {
  if (values.length === 0) return 0;
  if (t.aggregation === "sum") return values.reduce((a, b) => a + b, 0);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (t.aggregation === "mean_down_half") return Math.floor(mean * 2) / 2;
  if (t.aggregation === "mean_nearest_half") return Math.round(mean * 2) / 2;
  return Math.round(mean * 100) / 100; // plain mean, 2 dp
}

/** Native overall -> platform-wide 0–100 Feedback.score. */
export function normalizePreview(t: RubricTemplate, overall: number): number {
  const min = Number(t.scale_min);
  const max = Number(t.scale_max);
  if (max === min) return 0;
  return Math.round(((overall - min) / (max - min)) * 10000) / 100;
}
