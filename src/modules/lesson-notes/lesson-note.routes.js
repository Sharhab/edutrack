
import express from "express";

import {
  generateLessonNote,
  saveLessonNote,
  listLessonNotes,
  getLessonNote,
} from "./lesson-note.controller.js";

import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();

/**
 * The main router already applies authentication,
 * tenant context, and the billing guard.
 *
 * Restrict this feature to teachers and authorized
 * school administrators.
 */
router.use(
  authorize("teacher", "school_admin")
);

/**
 * Generate an AI lesson note.
 * POST /api/lesson-notes/generate
 */
router.post("/generate", generateLessonNote);

/**
 * Save a reviewed lesson note.
 * POST /api/lesson-notes
 */
router.post("/", saveLessonNote);

/**
 * List saved lesson notes.
 * GET /api/lesson-notes
 */
router.get("/", listLessonNotes);

/**
 * Retrieve a saved lesson note.
 * GET /api/lesson-notes/:id
 */
router.get("/:id", getLessonNote);

export default router;
