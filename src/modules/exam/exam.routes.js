


import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

import {
  createExamHandler,
  listExamsHandler,
} from "./exam.controller.js";

import {
  startExamHandler,
  saveAnswersHandler,
  submitExamHandler,
} from "./attempt.controller.js";

const router = express.Router();

router.use(protect);

// Staff exam management
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
