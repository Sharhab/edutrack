import { z } from "zod";

/*
=========================================
CREATE REQUIREMENT
=========================================
*/

export const createTimetableRequirementSchema =
  z.object({
    sessionId: z
      .string()
      .min(1, "Session is required"),

    termId: z
      .string()
      .min(1, "Term is required"),

    classId: z
      .string()
      .min(1, "Class is required"),

    subjectId: z
      .string()
      .min(1, "Subject is required"),

    teacherId: z
      .string()
      .min(1, "Teacher is required"),

    periodsPerWeek: z
      .number({
        error: "Periods per week is required",
      })
      .int("Periods per week must be a whole number")
      .min(1, "At least 1 period is required")
      .max(
        20,
        "Periods per week cannot exceed 20"
      ),

    allowDoublePeriod: z
      .boolean()
      .optional()
      .default(false),

    maxConsecutivePeriods: z
      .number({
        error: "Maximum consecutive periods is required",
      })
      .int(
        "Maximum consecutive periods must be a whole number"
      )
      .min(
        1,
        "Maximum consecutive periods must be at least 1"
      )
      .max(
        4,
        "Maximum consecutive periods cannot exceed 4"
      ),

    isActive: z
      .boolean()
      .optional()
      .default(true),
  });

/*
=========================================
UPDATE REQUIREMENT
=========================================
*/

export const updateTimetableRequirementSchema =
  z.object({
    sessionId: z
      .string()
      .min(1, "Session is required")
      .optional(),

    termId: z
      .string()
      .min(1, "Term is required")
      .optional(),

    classId: z
      .string()
      .min(1, "Class is required")
      .optional(),

    subjectId: z
      .string()
      .min(1, "Subject is required")
      .optional(),

    teacherId: z
      .string()
      .min(1, "Teacher is required")
      .optional(),

    periodsPerWeek: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional(),

    allowDoublePeriod: z
      .boolean()
      .optional(),

    maxConsecutivePeriods: z
      .number()
      .int()
      .min(1)
      .max(4)
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  });

/*
=========================================
BULK REQUIREMENTS
=========================================
*/

export const bulkTimetableRequirementSchema =
  z.object({
    requirements: z
      .array(
        createTimetableRequirementSchema
      )
      .min(
        1,
        "At least one timetable requirement is required"
      ),
  });
