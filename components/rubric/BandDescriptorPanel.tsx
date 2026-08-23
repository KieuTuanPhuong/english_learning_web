import type { CellPreview } from "./RubricMatrix";

// Descriptors are paragraphs, not tooltips — they expand in place below the
// matrix for the hovered/focused cell (doc 02 §4.2).
export function BandDescriptorPanel({ preview }: { preview: CellPreview | null }) {
  return (
    <div
      className="min-h-[4.5rem] rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm"
      aria-live="polite"
    >
      {preview ? (
        <>
          <p className="font-semibold text-zinc-700">
            {preview.criterionName} — {preview.bandLabel}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-600">
            {preview.descriptor}
          </p>
        </>
      ) : (
        <p className="text-zinc-400">
          Hover or focus a band cell to read its descriptor.
        </p>
      )}
    </div>
  );
}
