
import { z } from "zod";

/* =========================================
   SINGLE RESULT ITEM
========================================= */

const resultItemSchema = z
  .object({
    studentId: z
      .string()
      .min(1, "Student is required"),

    /*
     * LEGACY ASSESSMENT FIELDS
     *
     * Keep these for compatibility with existing
     * teacher entry, reports, and stored results.
     */

    ca1: z
      .number()
      .min(0, "CA1 cannot be negative")
      .max(10, "CA1 cannot exceed 10")
      .optional(),

    ca2: z
      .number()
      .min(0, "CA2 cannot be negative")
      .max(10, "CA2 cannot exceed 10")
      .optional(),

    assignment: z
      .number()
      .min(0, "Assignment cannot be negative")
      .max(10, "Assignment cannot exceed 10")
      .optional(),

    exam: z
      .number()
      .min(0, "Exam cannot be negative")
      .max(70, "Exam cannot exceed 70")
      .optional(),

    /*
     * DYNAMIC ASSESSMENT SCORES
     *
     * Example:
     * scores: {
     *   assignment: 8,
     *   ca1: 7,
     *   ca2: 9,
     *   exam: 60
     * }
     *
     * Component-specific maximums are checked
     * against the selected scheme in the service.
     */

    scores: z
      .record(
        z.string().min(1, "Assessment key cannot be empty"),
        z.number().finite().min(0, "Score cannot be negative")
      )
      .optional(),
  })
  .strict();

/* =========================================
   BULK RESULT SUBMISSION
========================================= */

export const createOrUpdateResultSchema = z
  .object({
    classId: z
      .string()
      .min(1, "Class is required"),

    subjectId: z
      .string()
      .min(1, "Subject is required"),

    sessionId: z
      .string()
      .min(1, "Academic session is required"),

    termId: z
      .string()
      .min(1, "Academic term is required"),

    results: z
      .array(resultItemSchema)
      .min(1, "At least one result is required"),
  })
  .strict();

/* =========================================
   RESULT QUERY
========================================= */

export const resultQuerySchema = z
  .object({
    classId: z.string().optional(),

    studentId: z.string().optional(),

    subjectId: z.string().optional(),

    sessionId: z.string().optional(),

    termId: z.string().optional(),

    status: z
      .enum([
        "draft",
        "generated",
        "published",
        "locked",
      ])
      .optional(),
  })
  .strict();
