import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(2),
  level: z.string().optional(),
  code: z.string().optional(),
  classTeacherId: z.string().nullable().optional(),
  capacity: z.number().int().min(0).optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(2).optional(),
  level: z.string().optional(),
  code: z.string().optional(),
  classTeacherId: z.string().nullable().optional(),
  capacity: z.number().int().min(0).optional(),
});

export const bulkUpsertClassSchema =
  z.object({
    classes: z
      .array(
        z.object({
          name: z.string().min(2),

          level:
            z.string().optional(),

          code:
            z.string().optional(),

          classTeacherId:
            z.string()
              .nullable()
              .optional(),

          capacity:
            z.number()
              .int()
              .min(0)
              .optional(),

          isActive:
            z.boolean()
              .optional(),
        })
      )
      .min(1),
  });