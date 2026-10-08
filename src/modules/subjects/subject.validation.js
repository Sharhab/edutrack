import { z } from "zod";

const subjectFields = {
  name: z
    .string()
    .min(
      2,
      "Subject name is required"
    ),

  code: z
    .string()
    .optional()
    .default(""),

  description: z
    .string()
    .optional()
    .default(""),

  category: z
    .enum([
      "general",
      "core",
      "science",
      "commercial",
      "arts",
      "vocational",
      "elective",
    ])
    .optional()
    .default("general"),

  isCore: z
    .boolean()
    .optional()
    .default(false),

  classIds: z
    .array(z.string())
    .optional()
    .default([]),

  teacherIds: z
    .array(z.string())
    .optional()
    .default([]),

  isActive: z
    .boolean()
    .optional()
    .default(true),
};

/* =========================================
   CREATE
========================================= */

export const createSubjectSchema =
  z.object(subjectFields);

/* =========================================
   UPDATE
========================================= */

export const updateSubjectSchema =
  z.object({
    name: z
      .string()
      .min(2)
      .optional(),

    code: z
      .string()
      .optional(),

    description: z
      .string()
      .optional(),

    category: z
      .enum([
        "general",
        "core",
        "science",
        "commercial",
        "arts",
        "vocational",
        "elective",
      ])
      .optional(),

    isCore: z
      .boolean()
      .optional(),

    classIds: z
      .array(z.string())
      .optional(),

    teacherIds: z
      .array(z.string())
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  });

/* =========================================
   BULK CREATE
========================================= */

export const bulkCreateSubjectSchema =
  z.object({
    subjects: z
      .array(createSubjectSchema)
      .min(
        1,
        "At least one subject is required"
      ),
  });
