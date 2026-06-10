import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .default("");

/**
 * =====================================
 * CREATE SCHOOL SCHEMA
 * =====================================
 */
export const createSchoolSchema = z.object({
  /**
   * SCHOOL INFO
   */
  name: z
    .string()
    .trim()
    .min(2, "School name is required"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid school email is required"),

  phone: optionalString,

  address: optionalString,

  domain: optionalString,

  principalName: optionalString,

  themeColor: z
    .string()
    .optional()
    .default("#06b6d4"),

  /**
   * SUBSCRIPTION
   */
  subscriptionPlan: z
    .enum(["starter", "growth",  "isTrial", "premium"])
    .default("starter"),

  subscriptionStatus: z
    .enum([
      "trial",
      "inactive",
      "pending",
      "active",
      "expired",
      "cancelled",
    ])
    .default("inactive"),

  onboardingStatus: z
    .enum([
      "trial",
      "pending_payment",
      "payment_initiated",
      "active",
      "suspended",
    ])
    .default("trial"),

  /**
   * ADMIN INFO
   */
  adminFirstName: z
    .string()
    .trim()
    .min(2, "Admin first name is required"),

  adminLastName: z
    .string()
    .trim()
    .min(2, "Admin last name is required"),

  adminEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid admin email is required"),

  adminPhone: optionalString,

  adminPassword: z
    .string()
    .min(
      6,
      "Admin password must be at least 6 characters"
    ),

  /**
   * SYSTEM
   */
  isActive: z
    .boolean()
    .optional()
    .default(false),
});

/**
 * =====================================
 * UPDATE SCHOOL SCHEMA
 * =====================================
 */
export const updateSchoolSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .optional(),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .optional(),

  phone: z.string().optional(),

  address: z.string().optional(),

  domain: z.string().optional(),

  principalName: z.string().optional(),

  themeColor: z.string().optional(),

  subscriptionPlan: z
    .enum(["starter", "growth", "premium"])
    .optional(),

  subscriptionStatus: z
    .enum([
      "inactive",
      "pending",
      "active",
      "expired",
      "cancelled",
    ])
    .optional(),

  onboardingStatus: z
    .enum([
      "trial",
      "pending_payment",
      "payment_initiated",
      "active",
      "suspended",
    ])
    .optional(),

  expiryDate: z
    .string()
    .optional()
    .nullable(),

  isActive: z.boolean().optional(),
});