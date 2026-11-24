
import { z } from "zod";

const optionalText = z.string().optional().default("");

const classIdsSchema = z
  .array(z.string().min(1))
  .min(1, "Assign at least one class to this teacher")
  .transform((ids) => [...new Set(ids)]);

export const createTeacherSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required"),
  middleName: optionalText,
  lastName: z.string().trim().min(2, "Last name is required"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),

  phone: optionalText,
  employeeId: optionalText,
  qualification: optionalText,
  designation: optionalText,

  dateOfBirth: optionalText,
  employmentDate: optionalText,

  employmentType: z
    .enum(["full_time", "part_time", "contract", "visiting"])
    .optional()
    .default("full_time"),

  classIds: classIdsSchema,

  gender: z.enum(["male", "female"]).optional().default("male"),
  address: optionalText,

  maritalStatus: optionalText,
  stateOfOrigin: optionalText,
  lga: optionalText,
  nationality: optionalText,

  staffCategory: optionalText,
  emergencyName: optionalText,
  emergencyPhone: optionalText,

  bloodGroup: optionalText,
  genotype: optionalText,
  nin: optionalText,
  photo: optionalText,

  isActive: z.boolean().optional(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const updateTeacherSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  middleName: optionalText.optional(),
  lastName: z.string().trim().min(2).optional(),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),

  phone: optionalText.optional(),

  employeeId: optionalText.optional(),
  qualification: optionalText.optional(),
  designation: optionalText.optional(),

  dateOfBirth: optionalText.optional(),
  employmentDate: optionalText.optional(),

  employmentType: z
    .enum(["full_time", "part_time", "contract", "visiting"])
    .optional(),

  classIds: z
    .array(z.string().min(1))
    .transform((ids) => [...new Set(ids)])
    .optional(),

  gender: z.enum(["male", "female"]).optional(),
  address: optionalText.optional(),

  maritalStatus: optionalText.optional(),
  stateOfOrigin: optionalText.optional(),
  lga: optionalText.optional(),
  nationality: optionalText.optional(),

  staffCategory: optionalText.optional(),
  emergencyName: optionalText.optional(),
  emergencyPhone: optionalText.optional(),

  bloodGroup: optionalText.optional(),
  genotype: optionalText.optional(),
  nin: optionalText.optional(),
  photo: optionalText.optional(),

  isActive: z.boolean().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
