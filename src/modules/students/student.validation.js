import { z } from "zod";

export const createStudentSchema = z.object({
  admissionNumber: z.string().min(2, "Admission number is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  gender: z.enum(["male", "female"]).optional().default("male"),
  dateOfBirth: z.string().optional().nullable(),
  classId: z.string().min(1, "Class is required"),
  parentIds: z.array(z.string()).optional().default([]),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  enrollmentDate: z.string().optional().nullable(),
  photo: z.string().optional().default(""),
});

export const updateStudentSchema = z.object({
  admissionNumber: z.string().min(2).optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  gender: z.enum(["male", "female"]).optional(),
  dateOfBirth: z.string().optional().nullable(),
  classId: z.string().optional(),
  parentIds: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  enrollmentDate: z.string().optional().nullable(),
  photo: z.string().optional(),
});


export const bulkUpsertStudentSchema = z.object({
  students: z
    .array(
      z.object({
        admissionNumber: z.string().min(2),
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        gender: z.enum(["male", "female"]).optional(),
        dateOfBirth: z.string().optional().nullable(),
        classId: z.string().min(1),
        parentIds: z.array(z.string()).optional(),
        status: z.enum(["active", "inactive"]).optional(),
        enrollmentDate: z.string().optional().nullable(),
        photo: z.string().optional(),
      })
    )
    .min(1),
});