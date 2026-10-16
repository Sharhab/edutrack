
import { z } from "zod";

const subscriptionStatus = z.enum([
  "trial",
  "active",
  "expired",
  "pending",
  "cancelled",
  "past_due",
  "suspended",
]);

const dateField = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional();

export const createSubscriptionSchema = z.object({
  schoolId: z.string().min(1, "schoolId is required"),
  plan: z.enum(["starter", "growth", "premium"]),
  amount: z.number().finite().positive(),
  billingCycle: z
    .enum(["monthly", "quarterly", "yearly"])
    .default("monthly"),
  status: subscriptionStatus.default("pending"),
  startsAt: dateField,
  expiresAt: dateField,
  notes: z.string().optional().default(""),
});

export const updateSubscriptionSchema = z.object({
  plan: z.enum(["starter", "growth", "premium"]).optional(),
  amount: z.number().finite().positive().optional(),
  billingCycle: z
    .enum(["monthly", "quarterly", "yearly"])
    .optional(),
  status: subscriptionStatus.optional(),
  startsAt: dateField,
  expiresAt: dateField,
  notes: z.string().optional(),
});

export const createManualPaymentSchema = z.object({
  schoolId: z.string().min(1, "schoolId is required"),
  subscriptionId: z.string().optional().nullable(),
  amount: z.number().finite().min(0),
  currency: z.string().default("NGN"),
  method: z
    .enum(["manual", "bank_transfer", "cash"])
    .default("manual"),
  reference: z.string().default(""),
  status: z.enum(["pending", "success", "failed"]).default("success"),
});

export const createInvoiceSchema = z.object({
  schoolId: z.string().min(1, "schoolId is required"),
  subscriptionId: z.string().optional().nullable(),
  amount: z.number().finite().min(0),
  dueDate: dateField,
  description: z.string().optional().default(""),
});

export const initializeBillingPaymentSchema = z.object({
  plan: z.enum(["starter", "growth", "premium"]),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]),
  callbackUrl: z.string().url().optional(),
});
