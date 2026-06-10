import { z } from "zod";

export const initializePaystackSchema = z.object({
  schoolId: z.string().min(1, "schoolId is required"),
  email: z.string().email().optional(),
  amount: z.number().min(0),
  plan: z.enum(["starter", "growth", "premium"]),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]).optional().default("monthly"),
  callbackUrl: z.string().optional(),
});