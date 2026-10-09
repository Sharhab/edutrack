import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

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
