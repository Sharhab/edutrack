import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getClassTimetableHandler,
} from "./class-timetable.controller.js";

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorize(
    "school_admin",
    "teacher",
    "student",
    "parent"
  ),
  asyncHandler(getClassTimetableHandler)
);

export default router;
