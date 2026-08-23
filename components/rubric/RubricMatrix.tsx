"use client";
// Fixed-shape input control (not a data grid): criteria rows × band columns,
// each row a radiogroup. Custom <table> per doc 02 §3 — no grid library.
import type { RubricTemplate } from "@/lib/types";
import { BandCell } from "./BandCell";

export interface CellPreview {
  criterionName: string;
  bandLabel: string;
  descriptor: string;
}

export function RubricMatrix({
  template,
  scores,
  onSelect,
  onPreview,
}: {
  template: RubricTemplate;
  scores: Record<number, number | undefined>;
  onSelect: (criterionId: number, band: number) => void;
  onPreview: (p: CellPreview | null) => void;
}) {
  // Scale is shared across criteria; columns are the union of band values.
  const bands = Array.from(
    new Set(
      template.criteria.flatMap((c) =>
        c.band_descriptors.map((d) => Number(d.band_value)),
      ),
    ),
  ).sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto" onMouseLeave={() => onPreview(null)}>
      <table className="w-full border-collapse text-center">
        <thead>
          <tr>
            <th className="border border-zinc-200 bg-zinc-100 p-2 text-left text-xs font-semibold text-zinc-600">
              Criterion
            </th>
            {bands.map((b) => (
              <th
                key={b}
                className="border border-zinc-200 bg-zinc-100 p-2 text-xs font-semibold text-zinc-600"
              >
                {b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {template.criteria.map((criterion) => {
            const descByBand = new Map(
              criterion.band_descriptors.map((d) => [Number(d.band_value), d]),
            );
            const selected = scores[criterion.id];
            return (
              <tr
                key={criterion.id}
                role="radiogroup"
                aria-label={criterion.name}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const available = bands.filter((b) => descByBand.has(b));
                  if (available.length === 0) return;
                  const idx = selected == null ? -1 : available.indexOf(selected);
                  const next =
                    e.key === "ArrowRight"
                      ? available[Math.min(idx + 1, available.length - 1)]
                      : available[Math.max(idx - 1, 0)];
                  if (next != null) onSelect(criterion.id, next);
                }}
              >
                <th
                  scope="row"
                  className="border border-zinc-200 bg-white p-2 text-left text-sm font-medium text-zinc-700"
                >
                  {criterion.name}
                </th>
                {bands.map((b) => {
                  const d = descByBand.get(b);
                  return (
                    <BandCell
                      key={b}
                      bandValue={b}
                      selected={selected === b}
                      disabled={!d}
                      ariaLabel={`${criterion.name}, band ${b}`}
                      onSelect={() => onSelect(criterion.id, b)}
                      onPreview={() => {
                        if (d) {
                          onPreview({
                            criterionName: criterion.name,
                            bandLabel: d.label || `Band ${b}`,
                            descriptor: d.descriptor,
                          });
                        }
                      }}
                    />
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
