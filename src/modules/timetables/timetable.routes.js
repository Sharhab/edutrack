import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createTimetableEntryHandler,
  listTimetableHandler,
  getTimetableEntryHandler,
  updateTimetableEntryHandler,
  deleteTimetableEntryHandler,
  clearTimetableHandler,
  getTimetableStatsHandler,
  generateTimetableHandler,
} from "./timetable.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));

/*
 * Generate timetable
 */
router.post(
  "/generate",
  asyncHandler(generateTimetableHandler)
);

/*
 * Clear all timetable entries
 * for a selected session and term.
 */
router.delete(
  "/clear",
  asyncHandler(clearTimetableHandler)
);

/*
 * Timetable statistics
 */
router.get(
  "/stats",
  asyncHandler(getTimetableStatsHandler)
);

/*
 * Create a single timetable entry
 */
router.post(
  "/",
  asyncHandler(createTimetableEntryHandler)
);

/*
 * List timetable entries
 */
router.get(
  "/",
  asyncHandler(listTimetableHandler)
);

/*
 * Get one timetable entry
 */
router.get(
  "/:id",
  asyncHandler(getTimetableEntryHandler)
);

/*
 * Update timetable entry
 */
router.put(
  "/:id",
  asyncHandler(updateTimetableEntryHandler)
);

/*
 * Delete timetable entry
 */
router.delete(
  "/:id",
  asyncHandler(deleteTimetableEntryHandler)
);

export default router;
