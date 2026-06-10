import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().min(2, "Subject name is required"),
  code: z.string().optional().default(""),
  classIds: z.array(z.string()).optional().default([]),
  teacherIds: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateSubjectSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().optional(),
  classIds: z.array(z.string()).optional(),
  teacherIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});