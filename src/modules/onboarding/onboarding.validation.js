import { z } from "zod";

/**
 * MAIN ONBOARDING
 */
export const onboardingSchema =
  z.object({
    schoolName: z
      .string()
      .trim()
      .min(2),

    slug: z
      .string()
      .trim()
      .min(2),

    adminFirstName: z
      .string()
      .trim()
      .min(2),

    adminLastName: z
      .string()
      .trim()
      .min(2),

    adminEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email(),

    adminPassword: z
      .string()
      .min(6),

    confirmPassword: z
      .string()
      .min(6),

    phone: z
      .string()
      .optional()
      .default(""),

    address: z
      .string()
      .optional()
      .default(""),

    domain: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((value) =>
        value && value.length > 0
          ? value
          : undefined
      ),

    principalName: z
      .string()
      .optional()
      .default(""),

    themeColor: z
      .string()
      .optional()
      .default("#06b6d4"),

    plan: z.enum([
      "starter",
      "growth",
      "premium",
    ]),

    billingCycle: z.enum([
      "monthly",
      "quarterly",
      "yearly",
    ]),
  });

/**
 * PAYSTACK INITIALIZATION
 */
export const onboardingInitializeSchema =
  z.object({
    schoolName: z
      .string()
      .trim()
      .min(2),

    adminFirstName: z
      .string()
      .trim()
      .min(2),

    adminLastName: z
      .string()
      .trim()
      .min(2),

    adminEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email(),

    adminPassword: z
      .string()
      .min(6),

    phone: z
      .string()
      .optional()
      .default(""),

    address: z
      .string()
      .optional()
      .default(""),

    domain: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((value) =>
        value && value.length > 0
          ? value
          : undefined
      ),

    principalName: z
      .string()
      .optional()
      .default(""),

    themeColor: z
      .string()
      .optional()
      .default("#06b6d4"),

    plan: z.enum([
      "starter",
      "growth",
      "premium",
    ]),

    billingCycle: z.enum([
      "monthly",
      "quarterly",
      "yearly",
    ]),

    amount: z.number(),

    callbackUrl: z
      .string()
      .optional(),
  });