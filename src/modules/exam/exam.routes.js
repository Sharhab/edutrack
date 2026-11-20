
import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

import {
  createExamHandler,
  listExamsHandler,
  publishExamHandler,
  closeExamHandler,
} from "./exam.controller.js";

import {
  startExamHandler,
  saveAnswersHandler,
  listStudentExamsHandler,
  submitExamHandler,
  listExamResultsHandler,
  reviewExamAttemptHandler,
} from "./attempt.controller.js";

import {
  syncCbtResultsHandler,
} from "./exam-result-sync.controller.js";

const router = express.Router();

router.use(protect);

// Student exam listing
router.get(
  "/student",
  authorize("student"),
  listStudentExamsHandler
);

// School admin exam management
router.post(
  "/",
  authorize("school_admin"),
  createExamHandler
);

router.get(
  "/",
  authorize("school_admin"),
  listExamsHandler
);

// Synchronize submitted CBT marks into the result assessment scheme
router.post(
  "/:examId/sync-results",
  authorize("school_admin"),
  syncCbtResultsHandler
);

router.get(
  "/:examId/results",
  authorize("school_admin"),
  listExamResultsHandler
);

router.get(
  "/:examId/attempts/:attemptId/review",
  authorize("school_admin"),
  reviewExamAttemptHandler
);

router.patch(
  "/:examId/publish",
  authorize("school_admin"),
  publishExamHandler
);

router.patch(
  "/:examId/close",
  authorize("school_admin"),
  closeExamHandler
);

// Student exam attempts
router.post(
  "/:examId/start",
  authorize("student"),
  startExamHandler
);

router.patch(
  "/attempts/:attemptId/answers",
  authorize("student"),
  saveAnswersHandler
);

router.post(
  "/attempts/:attemptId/submit",
  authorize("student"),
  submitExamHandler
);

export default router;



