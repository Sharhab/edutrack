import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getTeacherTimetableHandler,
} from "./teacher-timetable.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("teacher"));

router.get(
  "/",
  asyncHandler(getTeacherTimetableHandler)
);

export default router;
