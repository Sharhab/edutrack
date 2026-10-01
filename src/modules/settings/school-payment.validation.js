import { z } from "zod";

/* =========================================
   CONNECT PAYSTACK
========================================= */

export const connectPaystackSchema = z.object({
  bankCode: z
    .string()
    .min(1, "Bank code is required"),

  accountNumber: z
    .string()
    .regex(
      /^\d{10}$/,
      "Bank account number must be 10 digits"
    ),

  percentageCharge: z
    .coerce
    .number()
    .min(
      0,
      "Percentage charge cannot be negative"
    )
    .max(
      100,
      "Percentage charge cannot exceed 100"
    )
    .default(0),
});

/* =========================================
   UPDATE PAYSTACK ACCOUNT
========================================= */

export const updatePaystackAccountSchema =
  z
    .object({
      bankCode: z
        .string()
        .min(1)
        .optional(),

      accountNumber: z
        .string()
        .regex(
          /^\d{10}$/,
          "Bank account number must be 10 digits"
        )
        .optional(),

      percentageCharge: z
        .coerce
        .number()
        .min(
          0,
          "Percentage charge cannot be negative"
        )
        .max(
          100,
          "Percentage charge cannot exceed 100"
        )
        .optional(),
    })
    .refine(
      (data) =>
        data.bankCode !== undefined ||
        data.accountNumber !== undefined ||
        data.percentageCharge !== undefined,
      {
        message:
          "At least one payment setting is required",
      }
    );

/* =========================================
   ENABLE / DISABLE PAYMENTS
========================================= */

export const paymentStatusSchema = z.object({
  enabled: z.coerce.boolean(),
});