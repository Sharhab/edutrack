import { z } from "zod";

const optionalText = z.string().trim().optional();

export const createClassSchema = z.object({
name: z
.string()
.trim()
.min(2, "Class name must contain at least 2 characters")
.max(100, "Class name cannot exceed 100 characters"),

level: z
.string()
.trim()
.max(50, "Level cannot exceed 50 characters")
.optional()
.default(""),

code: z
.string()
.trim()
.max(30, "Class code cannot exceed 30 characters")
.optional()
.default(""),

classTeacherId: z
.string()
.nullable()
.optional()
.default(null),

capacity: z
.number()
.int("Capacity must be a whole number")
.min(0, "Capacity cannot be negative")
.max(10000, "Capacity is too large")
.optional()
.default(40),

isActive: z.boolean().optional().default(true),
});

export const updateClassSchema = z.object({
name: z
.string()
.trim()
.min(2, "Class name must contain at least 2 characters")
.max(100, "Class name cannot exceed 100 characters")
.optional(),

level: z
.string()
.trim()
.max(50, "Level cannot exceed 50 characters")
.optional(),

code: z
.string()
.trim()
.max(30, "Class code cannot exceed 30 characters")
.optional(),

classTeacherId: z
.string()
.nullable()
.optional(),

capacity: z
.number()
.int("Capacity must be a whole number")
.min(0, "Capacity cannot be negative")
.max(10000, "Capacity is too large")
.optional(),

isActive: z.boolean().optional(),
});

export const bulkUpsertClassSchema = z.object({
classes: z
.array(createClassSchema)
.min(1, "Add at least one class")
.max(500, "You can process at most 500 classes at a time"),
});
