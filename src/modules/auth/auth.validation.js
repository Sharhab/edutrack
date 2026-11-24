
import { z } from "zod";

export const loginSchema = z.object({
  // identifier supports email or teacher Employee ID.
  // email remains supported for existing frontend clients.
  identifier: z.string().trim().min(1).max(254).optional(),
  email: z.string().trim().optional(),
tenantSlug: z
  .string()
  .trim()
  .min(1)
  .max(100)
  .nullish(),
  password: z.string().min(1).max(128),
}).transform((data) => ({
  ...data,
  identifier: data.identifier || data.email || "",
}));

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "New password is too long"),
  })
  .refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: "New password must be different from the current password",
      path: ["newPassword"],
    }
  );
