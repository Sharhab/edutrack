import { z } from "zod";

export const updateSchoolProfileSchema = z.object({
  schoolName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  principalName: z.string().optional(),
  currentSession: z.string().optional(),
  currentTerm: z.string().optional(),
  themeColor: z.string().optional(),
  domain: z.string().optional(),
});