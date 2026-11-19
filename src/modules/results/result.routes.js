
import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

import {
  createResultHandler,
  listResultsHandler,
  getStudentResultsHandler,
  getAdminResultSummaryHandler,
  getAdminResultsOverviewHandler,
  generateResultsHandler,
  publishResultsHandler,
  lockResultsHandler,
  unlockResultsHandler,
  bulkUpsertResultsHandler,
} from "./result.controller.js";

import {
  getTeacherResultContextHandler,
} from "./result.context.controller.js";

const router = express.Router();

router.use(protect);

// Teacher and school admin result entry.
router.post(
  "/",
  authorize("school_admin", "teacher"),
  createResultHandler
);

router.post(
  "/bulk-upsert",
  authorize("school_admin", "teacher"),
  bulkUpsertResultsHandler
);

// Result reading. Service must enforce each user's scope.
router.get(
  "/",
  authorize("school_admin", "teacher"),
  listResultsHandler
);

// Student and parent result access.
// Ownership checks must be enforced in the service.
router.get(
  "/student/:studentId",
  authorize("school_admin", "parent", "student"),
  getStudentResultsHandler
);

// Teacher's available classes and subjects.
router.get(
  "/teacher/results/context",
  authorize("teacher"),
  getTeacherResultContextHandler
);

// Administrative result management.
router.get(
  "/admin/summary",
  authorize("school_admin"),
  getAdminResultSummaryHandler
);

router.get(
  "/admin/overview",
  authorize("school_admin"),
  getAdminResultsOverviewHandler
);

router.post(
  "/admin/generate",
  authorize("school_admin"),
  generateResultsHandler
);

router.post(
  "/admin/publish",
  authorize("school_admin"),
  publishResultsHandler
);

router.post(
  "/admin/lock",
  authorize("school_admin"),
  lockResultsHandler
);

router.post(
  "/admin/unlock",
  authorize("school_admin"),
  unlockResultsHandler
);

export default router;
