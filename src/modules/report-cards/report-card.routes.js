import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  classReportSheetHandler,
  studentReportCardHandler,
   generateClassReportCardsBundleController,
} from "./report-card.controller.js";

import {
  cumulativeStudentReportHandler,
  cumulativeClassReportHandler,
} from "./cumulative-report.controller.js";

const router = express.Router();
router.use(protect);

/* =========================
   STUDENT REPORT CARD
========================= */
router.get(
  "/class/:classId/bundle",
  protect,
  authorize("school_admin", "teacher"),
  asyncHandler(generateClassReportCardsBundleController)
);

router.get(
  "/class/:classId",
  authorize("school_admin", "teacher"),
  asyncHandler(classReportSheetHandler)
);

/* =========================================
   CUMULATIVE REPORTS
========================================= */

router.get(
  "/student/:studentId/cumulative",
  authorize("school_admin", "teacher", "parent"),
  asyncHandler(cumulativeStudentReportHandler)
);

router.get(
  "/class/:classId/cumulative",
  authorize("school_admin", "teacher"),
  asyncHandler(cumulativeClassReportHandler)
);
router.get(
  "/student/:studentId",
  authorize("school_admin", "teacher", "parent"),
  asyncHandler(studentReportCardHandler)
);


export default router;
