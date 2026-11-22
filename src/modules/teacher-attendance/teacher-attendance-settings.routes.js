
import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getTeacherAttendanceSettingsHandler,
  updateTeacherAttendanceSettingsHandler,
} from "./teacher-attendance-settings.controller.js";

const router = express.Router();

router.use(protect);

// School administrators can view and update their school's settings.
router.use(authorize("school_admin"));

router.get(
  "/",
  asyncHandler(getTeacherAttendanceSettingsHandler)
);

router.put(
  "/",
  asyncHandler(updateTeacherAttendanceSettingsHandler)
);

export default router;
