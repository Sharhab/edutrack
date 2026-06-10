import { z } from "zod";

export const controlTenantSchema = z.object({
  isActive: z.boolean().optional(),
  subscriptionStatus: z
    .enum(["active", "expired", "pending", "cancelled"])
    .optional(),
  expiryDate: z.string().optional().nullable(),
});