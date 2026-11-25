
import { z } from "zod";

const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMetres: z.number().min(0).max(10000).optional(),
});

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");

const workingDaysSchema = z
  .array(
    z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ])
  )
  .min(1, "Select at least one working day")
  .refine((days) => new Set(days).size === days.length, {
    message: "Working days must not contain duplicates",
  });


const validTimezone = (timezone) => {
  try {
    Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });
    return true;
  } catch {
    return false;
  }
};

export const updateTeacherAttendanceSettingsSchema = z
  .object({
    location: z
      .object({
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
        label: z.string().trim().max(250).optional(),
      })
      .strict()
      .optional(),

    geofenceRadiusMetres: z.number().int().min(25).max(1000).optional(),

    reportingTime: timeSchema.optional(),

    closingTime: timeSchema.optional(),

    lateGraceMinutes: z.number().int().min(0).max(180).optional(),

    clockInEnabled: z.boolean().optional(),

    clockOutRequired: z.boolean().optional(),

    timezone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine(validTimezone, {
        message: "Enter a valid timezone, such as Africa/Lagos",
      })
      .optional(),

    workingDays: workingDaysSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one setting to update",
  });


export const teacherClockInSchema = z
  .object({
    location: coordinateSchema,
  })
  .strict();

export const teacherClockOutSchema = z
  .object({
    location: coordinateSchema,
  })
  .strict();

export const teacherAttendanceQuerySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

    teacherId: z.string().regex(/^[a-f\d]{24}$/i).optional(),

    status: z
      .enum([
        "present",
        "late",
        "absent",
        "half_day",
        "on_leave",
        "excused",
      ])
      .optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      data.startDate <= data.endDate,
    {
      message: "Start date cannot be after end date",
      path: ["startDate"],
    }
  );


export const correctTeacherAttendanceSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD"),

    status: z.enum([
      "present",
      "late",
      "absent",
      "half_day",
      "on_leave",
      "excused",
    ]),

    reason: z.string().trim().min(5).max(1000),

    notes: z.string().trim().max(1000).optional(),
  })
  .strict();
