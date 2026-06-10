import { z } from "zod";

/* =========================================
   SINGLE RESULT ITEM
========================================= */
const resultItemSchema = z.object({
  studentId: z
    .string()
    .min(1, "Student is required"),

  ca1: z
    .number()
    .min(0)
    .max(20)
    .optional()
    .default(0),

  ca2: z
    .number()
    .min(0)
    .max(20)
    .optional()
    .default(0),

  assignment: z
    .number()
    .min(0)
    .max(10)
    .optional()
    .default(0),

  exam: z
    .number()
    .min(0)
    .max(50)
    .optional()
    .default(0),
});

/* =========================================
   BULK RESULT SUBMISSION
========================================= */
export const createOrUpdateResultSchema =
  z.object({
    classId: z
      .string()
      .min(1, "Class is required"),

    subjectId: z
      .string()
      .min(1, "Subject is required"),

    sessionId: z
      .string()
      .min(1, "Session is required"),

    termId: z
      .string()
      .min(1, "Term is required"),

    results: z
      .array(resultItemSchema)
      .min(
        1,
        "At least one result is required"
      ),
  });

/* =========================================
   RESULT QUERY
========================================= */
export const resultQuerySchema =
  z.object({
    classId: z.string().optional(),

    studentId:
      z.string().optional(),

    subjectId:
      z.string().optional(),

    sessionId:
      z.string().optional(),

    termId:
      z.string().optional(),

    status:
      z
        .enum([
          "draft",
          "published",
        ])
        .optional(),
  });