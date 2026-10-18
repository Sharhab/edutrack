import { z } from "zod";

export const generateLessonNoteSchema = z.object({
  sessionId: z.string().regex(/^[a-f\d]{24}$/i),
  termId: z.string().regex(/^[a-f\d]{24}$/i),
  classId: z.string().regex(/^[a-f\d]{24}$/i),
  subjectId: z.string().regex(/^[a-f\d]{24}$/i),

  topic: z.string().trim().min(2).max(200),
  week: z.number().int().min(1).max(20).optional(),
  durationMinutes: z.number().int().min(10).max(240).default(40),

  learningObjectives: z
    .array(z.string().trim().min(2).max(500))
    .max(10)
    .default([]),

  curriculumRequirements: z
    .string()
    .trim()
    .max(10000)
    .default(""),
});

export const saveLessonNoteSchema = z.object({
  topic: z.string().trim().min(2).max(200).optional(),
  week: z.number().int().min(1).max(20).nullable().optional(),
  durationMinutes: z.number().int().min(10).max(240).optional(),
  curriculumRequirements: z.string().max(10000).optional(),

  content: z.object({
    previousKnowledge: z.string().min(1),
    learningObjectives: z.array(z.string()).min(1).max(10),
    instructionalMaterials: z.array(z.string()).max(20),
    introduction: z.string().min(1),
    lessonDevelopment: z.array(
      z.object({
        stage: z.string().min(1),
        teacherActivities: z.string().min(1),
        learnerActivities: z.string().min(1),
      })
    ).min(1).max(8),
    evaluationQuestions: z.array(z.string()).max(20),
    conclusion: z.string().min(1),
    assignment: z.string(),
  }),

  status: z.enum(["draft", "saved"]).optional(),
});
