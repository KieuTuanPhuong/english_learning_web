// Category -> Tailwind class map. Literal class strings so the JIT keeps them.
import type { AnnotationCategory } from "@/lib/types";

interface CategoryStyle {
  label: string;
  badgeClass: string;
  markClass: string; // highlight background
  underlineClass: string; // border-b color
}

export const CATEGORY_STYLES: Record<AnnotationCategory, CategoryStyle> = {
  grammar: {
    label: "Grammar",
    badgeClass: "bg-red-100 text-red-800",
    markClass: "bg-red-100",
    underlineClass: "border-red-400",
  },
  vocabulary: {
    label: "Vocabulary",
    badgeClass: "bg-amber-100 text-amber-800",
    markClass: "bg-amber-100",
    underlineClass: "border-amber-400",
  },
  spelling: {
    label: "Spelling",
    badgeClass: "bg-orange-100 text-orange-800",
    markClass: "bg-orange-100",
    underlineClass: "border-orange-400",
  },
  coherence: {
    label: "Coherence",
    badgeClass: "bg-sky-100 text-sky-800",
    markClass: "bg-sky-100",
    underlineClass: "border-sky-400",
  },
  task_response: {
    label: "Task response",
    badgeClass: "bg-violet-100 text-violet-800",
    markClass: "bg-violet-100",
    underlineClass: "border-violet-400",
  },
  praise: {
    label: "Praise",
    badgeClass: "bg-emerald-100 text-emerald-800",
    markClass: "bg-emerald-100",
    underlineClass: "border-emerald-400",
  },
  other: {
    label: "Other",
    badgeClass: "bg-zinc-200 text-zinc-700",
    markClass: "bg-zinc-200",
    underlineClass: "border-zinc-400",
  },
};

export const CATEGORY_OPTIONS = (
  Object.keys(CATEGORY_STYLES) as AnnotationCategory[]
).map((value) => ({ value, label: CATEGORY_STYLES[value].label }));
