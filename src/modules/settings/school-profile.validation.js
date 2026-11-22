
import { z } from "zod";

const hexColorSchema = z
  .string()
  .regex(
    /^#[0-9A-Fa-f]{6}$/,
    "Color must be a valid six-digit HEX color."
  );

const brandColorsSchema = z
  .object({
    primary: hexColorSchema.optional(),
    secondary: hexColorSchema.optional(),
    accent: hexColorSchema.optional(),
    background: hexColorSchema.optional(),
    surface: hexColorSchema.optional(),
    text: hexColorSchema.optional(),
  })
  .partial();

export const updateSchoolProfileSchema = z.object({
  schoolName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  principalName: z.string().optional(),

  currentSession: z.string().optional(),
  currentTerm: z.string().optional(),

  themeColor: hexColorSchema.optional(),
  brandColors: brandColorsSchema.optional(),

  domain: z.string().optional(),
  motto: z.string().max(200).optional(),
});
