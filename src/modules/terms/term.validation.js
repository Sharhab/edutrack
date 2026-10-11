import { z } from "zod";

const optionalDate = z
  .union([z.string().datetime({ offset: true }), z.string().date()])
  .nullable()
  .optional();

export const createTermSchema = z
  .object({
    sessionId: z.string().min(1, "Session is required"),
    name: z.string().trim().min(2, "Term name is required").max(80),
    startDate: optionalDate,
    endDate: optionalDate,
    order: z.number().int().positive().optional(),
    isCurrent: z.boolean().optional().default(false),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      new Date(data.startDate) <= new Date(data.endDate),
    {
      message: "Term end date must be on or after its start date",
      path: ["endDate"],
    }
  );
