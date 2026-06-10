import express from "express";

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

import { protect } from "../../middlewares/auth.middleware.js";

import {
  getTeacherResultContextHandler,
} from "./result.context.controller.js";

const router = express.Router();

/* =========================================
   GLOBAL AUTH
========================================= */
router.use(protect);

/* =========================================
   CORE RESULT OPERATIONS
========================================= */

// Create single result
router.post("/", createResultHandler);

// List results (filtered by class/subject/session via query)
router.get("/", listResultsHandler);

// Bulk upsert (teacher entry system)
router.post("/bulk-upsert", bulkUpsertResultsHandler);

// Student results
router.get("/student/:studentId", getStudentResultsHandler);

// Teacher context (who can enter what)
router.get("/teacher/results/context", getTeacherResultContextHandler);

/* =========================================
   ADMIN RESULT ENGINE (CONTROL CENTER)
========================================= */

// Summary dashboard (progress tracking)
router.get("/admin/summary", getAdminResultSummaryHandler);

// Full overview (detailed breakdown)
router.get("/admin/overview", getAdminResultsOverviewHandler);

// Generate final results (compute term results)
router.post("/admin/generate", generateResultsHandler);

// Publish results (make visible to students)
router.post("/admin/publish", publishResultsHandler);

// Lock results (freeze editing)
router.post("/admin/lock", lockResultsHandler);

// Unlock results (re-open editing)
router.post("/admin/unlock", unlockResultsHandler);

export default router;