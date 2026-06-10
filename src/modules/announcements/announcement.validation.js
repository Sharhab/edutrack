import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  message: z.string().min(2, "Message is required"),
  audience: z.enum(["all", "teachers", "parents"]).optional().default("all"),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(2).optional(),
  message: z.string().min(2).optional(),
  audience: z.enum(["all", "teachers", "parents"]).optional(),
});