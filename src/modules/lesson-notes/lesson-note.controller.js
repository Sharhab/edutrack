
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";

import {
  generateTeacherLessonNote,
  saveTeacherLessonNote,
  getTeacherLessonNotes,
  getTeacherLessonNoteById,
} from "./lesson-note.service.js";

import {
  generateLessonNoteSchema,
  saveLessonNoteSchema,
} from "./lesson-note.validation.js";

/**
 * Validate request data using Zod.
 */
function validatePayload(schema, payload) {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const field = issue.path.join(".");
        return field
          ? `${field}: ${issue.message}`
          : issue.message;
      })
      .join("; ");

    throw new ApiError(400, message);
  }

  return result.data;
}

/**
 * POST /lesson-notes/generate
 *
 * Generate a lesson note with AI.
 * The result is returned for review, not saved automatically.
 */
export const generateLessonNote = asyncHandler(
  async (req, res) => {
    const payload = validatePayload(
      generateLessonNoteSchema,
      req.body
    );

    const result = await generateTeacherLessonNote(
      req.user.id,
      payload
    );

    res.status(200).json(result);
  }
);

/**
 * POST /lesson-notes
 *
 * Save a reviewed lesson note.
 */
export const saveLessonNote = asyncHandler(
  async (req, res) => {
    const payload = validatePayload(
      saveLessonNoteSchema,
      req.body
    );

    const result = await saveTeacherLessonNote(
      req.user.id,
      payload
    );

    res.status(201).json(result);
  }
);

/**
 * GET /lesson-notes
 *
 * List the authenticated teacher's saved notes.
 */
export const listLessonNotes = asyncHandler(
  async (req, res) => {
    const result = await getTeacherLessonNotes(
      req.user.id,
      req.query
    );

    res.status(200).json(result);
  }
);

/**
 * GET /lesson-notes/:id
 *
 * Retrieve one lesson note belonging to the teacher.
 */
export const getLessonNote = asyncHandler(
  async (req, res) => {
    const result = await getTeacherLessonNoteById(
      req.user.id,
      req.params.id
    );

    res.status(200).json(result);
  }
);
