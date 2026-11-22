
import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  clockInHandler,
  clockOutHandler,
  myAttendanceHandler,
  listTeacherAttendanceHandler,
} from "./teacher-attendance.controller.js";

const router = express.Router();

router.use(protect);

// Teacher clock-in and clock-out.
router.post(
  "/clock-in",
  authorize("teacher"),
  asyncHandler(clockInHandler)
);

router.post(
  "/clock-out",
  authorize("teacher"),
  asyncHandler(clockOutHandler)
);

// Teacher views only their own records.
router.get(
  "/my-attendance",
  authorize("teacher"),
  asyncHandler(myAttendanceHandler)
);

// School administrator views school-wide attendance.
router.get(
  "/",
  authorize("school_admin"),
  asyncHandler(listTeacherAttendanceHandler)
);

export default router;
