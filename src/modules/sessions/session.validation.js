import { z } from "zod";

const optionalDate = z
  .union([z.string().datetime({ offset: true }), z.string().date()])
  .nullable()
  .optional();

export const createSessionSchema = z
  .object({
    name: z.string().trim().min(3, "Session name is required"),
    startDate: optionalDate,
    endDate: optionalDate,
    isCurrent: z.boolean().optional().default(false),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      new Date(data.startDate) <= new Date(data.endDate),
    {
      message: "Session end date must be on or after its start date",
      path: ["endDate"],
    }
  );
