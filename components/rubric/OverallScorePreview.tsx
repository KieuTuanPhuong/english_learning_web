import type { RubricTemplate } from "@/lib/types";
import { aggregatePreview, normalizePreview } from "./aggregate";

// Leads with the native band, /100 secondary, labelled "computed" — the server
// value is authoritative and replaces this on submit (doc 02 §4.4, risk 2).
export function OverallScorePreview({
  template,
  values,
}: {
  template: RubricTemplate;
  values: number[];
}) {
  const overall = aggregatePreview(template, values);
  const normalized = normalizePreview(template, overall);
  return (
    <div className="flex items-baseline gap-2 rounded-md bg-teal-50 px-3 py-2">
      <span className="text-lg font-bold text-teal-800">Band {overall}</span>
      <span className="text-sm text-teal-700">· {normalized}/100</span>
      <span className="text-xs text-teal-600">(computed)</span>
    </div>
  );
}
