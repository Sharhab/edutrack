
import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getClassTraitAssessmentsHandler,
  saveStudentTraitAssessmentHandler,
} from "./trait-assessment.controller.js";

const router = express.Router();

router.use(protect);

/**
 * Load trait assessments for a class and academic period.
 *
 * GET /api/trait-assessments/class/:classId?sessionId=...&termId=...
 */
router.get(
  "/class/:classId",
  authorize("school_admin", "teacher"),
  asyncHandler(getClassTraitAssessmentsHandler)
);

/**
 * Create or update a student's trait assessment.
 *
 * PUT /api/trait-assessments/student/:studentId
 */
router.put(
  "/student/:studentId",
  authorize("school_admin", "teacher"),
  asyncHandler(saveStudentTraitAssessmentHandler)
);

export default router;

