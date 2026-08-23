"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

// One matrix cell = one band for one criterion. Radio semantics per cell;
// selection reinforced with a check icon (never color-only, doc 02 a11y).
export function BandCell({
  bandValue,
  selected,
  disabled,
  ariaLabel,
  onSelect,
  onPreview,
}: {
  bandValue: number;
  selected: boolean;
  disabled: boolean;
  ariaLabel: string;
  onSelect: () => void;
  onPreview: () => void;
}) {
  if (disabled) {
    return <td className="border border-zinc-200 bg-zinc-50/60" aria-hidden />;
  }
  return (
    <td className="border border-zinc-200 p-0">
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={ariaLabel}
        tabIndex={selected ? 0 : -1}
        onClick={onSelect}
        onMouseEnter={onPreview}
        onFocus={onPreview}
        className={cn(
          "flex h-11 w-full min-w-[2.75rem] items-center justify-center gap-1 text-sm font-medium transition",
          selected ? "bg-teal-600 text-white" : "text-zinc-600 hover:bg-teal-50",
        )}
      >
        {selected && <Check size={14} />}
        {bandValue}
      </button>
    </td>
  );
}
