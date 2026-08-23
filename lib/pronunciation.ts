// Runtime validation for pronunciation data crossing the JSONField boundary,
// plus the drill form schema and the display-threshold helper. DRF serializes
// DecimalField as strings, so every score is coerced once here (doc 04 §4.6) —
// never sprinkle parseFloat in components.
import { z } from "zod";
import type { Strictness } from "./types";

const score = z.coerce.number().min(0).max(100);

export const phonemeResultSchema = z.object({
  phoneme: z.string(),
  accuracy: score,
});

export const wordResultSchema = z.object({
  word: z.string(),
  accuracy: score,
  error_type: z
    .enum(["None", "Omission", "Insertion", "Mispronunciation"])
    .nullish(),
  phonemes: z.array(phonemeResultSchema).default([]),
});

export const wordResultsSchema = z.array(wordResultSchema);
export type PhonemeResult = z.infer<typeof phonemeResultSchema>;
export type WordResult = z.infer<typeof wordResultSchema>;

/** null -> render scores without the breakdown (soft fail, doc 04 N5/risk). */
export function parseWordResults(raw: unknown): WordResult[] | null {
  const parsed = wordResultsSchema.safeParse(raw);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("word_results failed validation", parsed.error);
    }
    return null;
  }
  return parsed.data;
}

// Strictness shifts DISPLAY thresholds only (backend §4.4), not the scores.
export function scoreTone(
  accuracy: number,
  strictness: Strictness = "standard",
): "green" | "amber" | "red" {
  const t =
    strictness === "strict"
      ? { green: 90, amber: 75 }
      : strictness === "lenient"
        ? { green: 70, amber: 50 }
        : { green: 80, amber: 60 };
  if (accuracy >= t.green) return "green";
  if (accuracy >= t.amber) return "amber";
  return "red";
}

// Drill form (validated in the modal submit handler via safeParse). contrast
// text is required iff the drill is a minimal pair.
export const drillFormSchema = z
  .object({
    target_text: z.string().trim().min(1, "Target text is required").max(255),
    contrast_text: z.string().trim().max(255).optional(),
    phoneme_hint: z.string().trim().max(255).optional(),
    drill_type: z.enum(["word", "sentence", "minimal_pair"]),
    difficulty_level: z
      .enum(["beginner", "intermediate", "advanced"])
      .optional(),
    module_id: z.number().int().optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.drill_type === "minimal_pair" && !v.contrast_text?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["contrast_text"],
        message: "Contrast text is required for minimal pairs.",
      });
    }
  });
export type DrillFormValues = z.infer<typeof drillFormSchema>;
