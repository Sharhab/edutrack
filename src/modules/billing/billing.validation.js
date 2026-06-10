import { z } from "zod";

export const createSubscriptionSchema = z.object({
  schoolId: z.string().min(1, "schoolId is required"),
  plan: z.enum(["starter", "growth", "premium"]),
  amount: z.number().min(0),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]).optional().default("monthly"),
  status: z.enum(["active", "expired", "pending", "cancelled"]).optional().default("pending"),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  notes: z.string().optional().default(""),
});

export const updateSubscriptionSchema = z.object({
  plan: z.enum(["starter", "growth", "premium"]).optional(),
  amount: z.number().min(0).optional(),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]).optional(),
  status: z.enum(["active", "expired", "pending", "cancelled"]).optional(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const createManualPaymentSchema = z.object({
  schoolId: z.string().min(1, "schoolId is required"),
  subscriptionId: z.string().optional().nullable(),
  amount: z.number().min(0),

  currency: z.string().default("NGN"),
  method: z.enum(["manual", "bank_transfer", "cash"]).default("manual"),
  reference: z.string().default(""),
  status: z.enum(["pending", "success", "failed"]).default("success"),
});

export const createInvoiceSchema = z.object({
  schoolId: z.string().min(1, "schoolId is required"),
  subscriptionId: z.string().optional().nullable(),
  amount: z.number().min(0),
  dueDate: z.string().optional().nullable(),
  description: z.string().optional().default(""),
});

export const initializeBillingPaymentSchema = z.object({
  plan: z.enum(["starter", "growth", "premium"]),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]),
  callbackUrl: z.string().optional(),
});