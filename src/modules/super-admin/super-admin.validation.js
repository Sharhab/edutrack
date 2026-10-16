
import { z } from "zod";

export const controlTenantSchema = z.object({
  isActive: z.boolean().optional(),

  subscriptionStatus: z
    .enum([
      "trial",
      "active",
      "inactive",
      "pending",
      "past_due",
      "expired",
      "cancelled",
    ])
    .optional(),

  plan: z
    .enum(["starter", "growth", "premium"])
    .optional(),

  billingCycle: z
    .enum(["monthly", "quarterly", "yearly"])
    .optional(),

  expiryDate: z
    .string()
    .datetime()
    .nullable()
    .optional(),

  trialStartAt: z
    .string()
    .datetime()
    .nullable()
    .optional(),

  trialEndsAt: z
    .string()
    .datetime()
    .nullable()
    .optional(),
});
