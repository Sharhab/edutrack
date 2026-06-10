import { z } from "zod";

export const createTermSchema = z.object({
  sessionId: z.string().min(1, "Session is required"),
  name: z.enum(["First Term", "Second Term", "Third Term"]),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().optional().default(false),
});