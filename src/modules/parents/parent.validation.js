import { z } from "zod";

export const createParentSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().default(""),
  password: z.string().min(6, "Password must be at least 6 characters"),
  occupation: z.string().optional().default(""),
  address: z.string().optional().default(""),
  relationshipToStudent: z.string().optional().default(""),
  studentIds: z.array(z.string()).optional().default([]),
});

export const updateParentSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  relationshipToStudent: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});