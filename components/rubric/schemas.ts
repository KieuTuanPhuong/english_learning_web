// Template-driven zod schemas for rubric grading. Built from the fetched
// template so scale bounds / step / completeness are validated against the
// exact rubric in play (backend doc 02 §4.3 validation rules 3 & 4).
import { z } from "zod";
import type { RubricTemplate } from "@/lib/types";

export function buildCriterionScoreSchema(t: RubricTemplate) {
  const min = Number(t.scale_min);
  const max = Number(t.scale_max);
  const step = Number(t.score_step);
  return z.object({
    criterion_id: z.number().int(),
    score: z
      .number()
      .min(min)
      .max(max)
      // integer-math step check — avoids float modulo (works for step 0.5 or 1)
      .refine(
        (v) => Math.round((v - min) * 10) % Math.round(step * 10) === 0,
        { message: `Score must be in steps of ${step}` },
      ),
    note: z.string().max(2000).optional(),
  });
}

export function buildGradeFormSchema(t: RubricTemplate) {
  return z.object({
    criterion_scores: z
      .array(buildCriterionScoreSchema(t))
      .superRefine((rows, ctx) => {
        const expected = new Set(t.criteria.map((c) => c.id));
        const got = new Set(rows.map((r) => r.criterion_id));
        const complete =
          expected.size === got.size &&
          [...expected].every((id) => got.has(id));
        if (!complete) {
          ctx.addIssue({
            code: "custom",
            message: "Score every criterion before submitting.",
          });
        }
      }),
    comments: z.string().trim().min(1, "Comments are required"),
  });
}
