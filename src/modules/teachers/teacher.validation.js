import { z } from "zod";

export const createTeacherSchema =
  z.object({
    firstName: z
      .string()
      .min(
        2,
        "First name is required"
      ),

    lastName: z
      .string()
      .min(
        2,
        "Last name is required"
      ),

    email: z
      .string()
      .email(
        "Valid email is required"
      ),

    phone: z
      .string()
      .optional()
      .default(""),

    password: z
      .string()
      .min(
        6,
        "Password must be at least 6 characters"
      ),

    employeeId: z
      .string()
      .optional()
      .default(""),

    qualification: z
      .string()
      .optional()
      .default(""),

    subjectIds: z
      .array(z.string())
      .optional()
      .default([]),

    classIds: z
      .array(z.string())
      .optional()
      .default([]),

    status: z
      .enum([
        "active",
        "inactive",
      ])
      .optional()
      .default("active"),
  });

export const updateTeacherSchema =
  z.object({
    firstName: z
      .string()
      .min(2)
      .optional(),

    lastName: z
      .string()
      .min(2)
      .optional(),

    phone: z
      .string()
      .optional(),

    employeeId: z
      .string()
      .optional(),

    qualification: z
      .string()
      .optional(),

    subjectIds: z
      .array(z.string())
      .optional(),

    classIds: z
      .array(z.string())
      .optional(),

    status: z
      .enum([
        "active",
        "inactive",
      ])
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  });

/**
 * =========================================
 * BULK IMPORT
 * =========================================
 */
export const bulkUpsertTeacherSchema =
  z.object({
    teachers: z
      .array(
        z.object({
          firstName: z
            .string()
            .min(2),

          lastName: z
            .string()
            .min(2),

          email: z
            .string()
            .email(),

          phone: z
            .string()
            .optional(),

          employeeId: z
            .string()
            .optional(),

          qualification: z
            .string()
            .optional(),

          status: z
            .enum([
              "active",
              "inactive",
            ])
            .optional(),
        })
      )
      .min(1),
  });