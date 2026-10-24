
import { z } from "zod";

import {
  PSYCHOMOTOR_TRAITS,
  AFFECTIVE_TRAITS,
} from "./trait-assessment.constants.js";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const traitRatingSchema = z.object({
  traitKey: z.string().min(1, "Trait key is required"),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
});

function createTraitArraySchema(traits, label) {
  const allowedKeys = new Set(traits.map((trait) => trait.key));

  return z
    .array(traitRatingSchema)
    .superRefine((ratings, ctx) => {
      const seen = new Set();

      ratings.forEach((item, index) => {
        if (!allowedKeys.has(item.traitKey)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "traitKey"],
            message: `Invalid ${label} trait: ${item.traitKey}`,
          });
        }

        if (seen.has(item.traitKey)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "traitKey"],
            message: `Duplicate ${label} trait: ${item.traitKey}`,
          });
        }

        seen.add(item.traitKey);
      });
    });
}

export const traitAssessmentParamsSchema = z.object({
  classId: objectIdSchema,
});

export const traitAssessmentStudentParamsSchema = z.object({
  studentId: objectIdSchema,
});

export const traitAssessmentQuerySchema = z.object({
  sessionId: objectIdSchema,
  termId: objectIdSchema,
});

export const saveTraitAssessmentSchema = z.object({
  classId: objectIdSchema,
  sessionId: objectIdSchema,
  termId: objectIdSchema,

  psychomotor: createTraitArraySchema(
    PSYCHOMOTOR_TRAITS,
    "psychomotor"
  ),

  affective: createTraitArraySchema(
    AFFECTIVE_TRAITS,
    "affective"
  ),

  teacherComment: z
    .string()
    .trim()
    .max(1000, "Teacher comment cannot exceed 1000 characters")
    .optional()
    .default(""),
});

