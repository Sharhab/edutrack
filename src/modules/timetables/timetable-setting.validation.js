import { z } from "zod";

/*
=========================================
PERIOD VALIDATION
=========================================
*/

const timetablePeriodSchema = z.object({
  name: z
    .string()
    .min(1, "Period name is required")
    .trim(),

  startTime: z
    .string()
    .min(1, "Start time is required")
    .trim(),

  endTime: z
    .string()
    .min(1, "End time is required")
    .trim(),

  isBreak: z
    .boolean()
    .optional()
    .default(false),

  isActive: z
    .boolean()
    .optional()
    .default(true),
});

/*
=========================================
DAYS
=========================================
*/

const daysSchema = z
  .array(
    z.enum([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ])
  )
  .min(1, "At least one school day is required");

/*
=========================================
CREATE TIMETABLE SETTINGS
=========================================
*/

export const createTimetableSettingSchema =
  z.object({
    sessionId: z
      .string()
      .min(1, "Session is required"),

    termId: z
      .string()
      .min(1, "Term is required"),

    days: daysSchema,

    periods: z
      .array(timetablePeriodSchema)
      .min(1, "At least one period is required"),
  });

/*
=========================================
UPDATE TIMETABLE SETTINGS
=========================================
*/

export const updateTimetableSettingSchema =
  z.object({
    sessionId: z
      .string()
      .min(1)
      .optional(),

    termId: z
      .string()
      .min(1)
      .optional(),

    days: daysSchema.optional(),

    periods: z
      .array(timetablePeriodSchema)
      .min(1, "At least one period is required")
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  });
