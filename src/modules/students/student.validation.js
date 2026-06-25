import { z } from "zod";

const statusEnum = z.enum([
  "active",
  "inactive",
  "suspended",
  "graduated",
]);

const entryTypeEnum = z.enum([
  "new",
  "transfer",
  "promotion",
  "reentry",
]);

const bloodGroupEnum = z.enum([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);

const genotypeEnum = z.enum([
  "AA",
  "AS",
  "SS",
  "AC",
  "SC",
]);

export const createStudentSchema = z.object({
  admissionNumber: z
    .string()
    .min(2, "Admission number is required"),

  firstName: z
    .string()
    .min(2, "First name is required"),

  middleName: z
    .string()
    .optional()
    .default(""),

  lastName: z
    .string()
    .min(2, "Last name is required"),

  gender: z
    .enum(["male", "female"])
    .optional()
    .default("male"),

  dateOfBirth: z
    .string()
    .optional()
    .nullable(),

  classId: z
    .string()
    .min(1, "Class is required"),

  parentIds: z
    .array(z.string())
    .optional()
    .default([]),

  entryType: entryTypeEnum
    .optional()
    .default("new"),

  previousSchool: z
    .string()
    .optional()
    .default(""),

  stateOfOrigin: z
    .string()
    .optional()
    .default(""),

  lga: z
    .string()
    .optional()
    .default(""),

  address: z
    .string()
    .optional()
    .default(""),

  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .optional()
    .default(""),

  emergencyName: z
    .string()
    .optional()
    .default(""),

  emergencyPhone: z
    .string()
    .optional()
    .default(""),

  bloodGroup: bloodGroupEnum
    .optional(),

  genotype: genotypeEnum
    .optional(),

  nin: z
    .string()
    .optional()
    .default(""),

  birthCertificateNo: z
    .string()
    .optional()
    .default(""),

  status: statusEnum
    .optional()
    .default("active"),

  enrollmentDate: z
    .string()
    .optional()
    .nullable(),

  photo: z
    .string()
    .optional()
    .default(""),
});

export const updateStudentSchema =
  createStudentSchema.partial();

export const bulkUpsertStudentSchema =
  z.object({
    students: z
      .array(createStudentSchema)
      .min(1),
  });
