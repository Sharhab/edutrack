
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID");

const lessonNoteContentSchema = z.object({
  previousKnowledge: z.string().trim().min(1).max(5000),

  learningObjectives: z
    .array(z.string().trim().min(1).max(500))
    .min(1)
    .max(10),

  instructionalMaterials: z
    .array(z.string().trim().min(1).max(300))
    .max(20),

  introduction: z.string().trim().min(1).max(5000),

  lessonDevelopment: z
    .array(
      z.object({
        stage: z.string().trim().min(1).max(200),
        teacherActivities: z.string().trim().min(1).max(5000),
        learnerActivities: z.string().trim().min(1).max(5000),
      })
    )
    .min(1)
    .max(8),

  evaluationQuestions: z
    .array(z.string().trim().min(1).max(1000))
    .max(20),

  conclusion: z.string().trim().min(1).max(3000),

  assignment: z.string().max(3000).default(""),
});

const lessonNoteMetadataSchema = z.object({
  sessionId: objectIdSchema,
  termId: objectIdSchema,
  classId: objectIdSchema,
  subjectId: objectIdSchema,

  topic: z.string().trim().min(2).max(200),

  week: z
    .union([
      z.number().int().min(1).max(20),
      z.null(),
    ])
    .optional(),

  durationMinutes: z
    .number()
    .int()
    .min(10)
    .max(240)
    .default(40),

  curriculumRequirements: z
    .string()
    .trim()
    .max(10000)
    .default(""),
});

/**
 * POST /lesson-notes/generate
 */
export const generateLessonNoteSchema =
  lessonNoteMetadataSchema.extend({
    learningObjectives: z
      .array(z.string().trim().min(2).max(500))
      .max(10)
      .default([]),
  });

/**
 * POST /lesson-notes
 *
 * The metadata is required because the service must
 * verify the teacher's school and subject assignment.
 */
export const saveLessonNoteSchema =
  lessonNoteMetadataSchema.extend({
    content: lessonNoteContentSchema,
  });

/**
 * PUT /lesson-notes/:id
 *
 * Reserved for a future edit endpoint.
 * Do not connect it until the update service exists.
 */
export const updateLessonNoteSchema = z
  .object({
    topic: z.string().trim().min(2).max(200).optional(),
    week: z
      .union([
        z.number().int().min(1).max(20),
        z.null(),
      ])
      .optional(),
    durationMinutes: z.number().int().min(10).max(240).optional(),
    curriculumRequirements: z.string().trim().max(10000).optional(),
    content: lessonNoteContentSchema.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update"
  );
