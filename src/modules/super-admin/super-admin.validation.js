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

  expiryDate: z.string().datetime().optional().nullable(),

  trialEndsAt: z.string().datetime().optional().nullable(),
});
