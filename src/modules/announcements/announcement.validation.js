
import { z } from "zod";

const audienceSchema = z.enum([
  "all",
  "teachers",
  "parents",
  "students",
]);

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  message: z.string().trim().min(2, "Message is required"),
  audience: audienceSchema.optional().default("all"),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(2).optional(),
  message: z.string().trim().min(2).optional(),
  audience: audienceSchema.optional(),
});
