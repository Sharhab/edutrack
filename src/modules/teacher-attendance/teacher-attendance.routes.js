
import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  clockInHandler,
  clockOutHandler,
  myAttendanceHandler,
  listTeacherAttendanceHandler,
  teacherAttendanceDashboardHandler,
} from "./teacher-attendance.controller.js";

const router = express.Router();

router.use(protect);

// TEACHER CLOCK IN
router.post(
  "/clock-in",
  authorize("teacher"),
  asyncHandler(clockInHandler)
);

// TEACHER CLOCK OUT
router.post(
  "/clock-out",
  authorize("teacher"),
  asyncHandler(clockOutHandler)
);

// TEACHER: OWN ATTENDANCE
router.get(
  "/my-attendance",
  authorize("teacher"),
  asyncHandler(myAttendanceHandler)
);

// ADMIN: DASHBOARD
router.get(
  "/dashboard",
  authorize("school_admin"),
  asyncHandler(teacherAttendanceDashboardHandler)
);

// ADMIN: ATTENDANCE RECORDS
router.get(
  "/",
  authorize("school_admin"),
  asyncHandler(listTeacherAttendanceHandler)
);

export default router;

