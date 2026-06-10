import express from "express";
import {
  getTeacherPortalHandler,
  getTeacherClassStudentsHandler,
  submitTeacherAttendanceHandler,
} from "./teacher-portal.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = express.Router();

router.use(protect);
router.use(authorize("teacher", "school_admin", "super_admin"));

/* =========================================
   PORTAL
========================================= */
router.get(
  "/portal",
  asyncHandler(getTeacherPortalHandler)
);

/* =========================================
   CLASS STUDENTS
========================================= */
router.get(
  "/classes/:classId/students",
  asyncHandler(getTeacherClassStudentsHandler)
);

/* =========================================
   ATTENDANCE
========================================= */
router.post(
  "/attendance",
  asyncHandler(submitTeacherAttendanceHandler)
);

export default router;