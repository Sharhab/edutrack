import { z } from "zod";

export const createSessionSchema = z.object({
  name: z.string().min(3, "Session name is required"),
  isCurrent: z.boolean().optional().default(false),
});