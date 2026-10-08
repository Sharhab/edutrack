import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getStudentTimetableHandler,
} from "./student-timetable.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("student"));

router.get(
  "/",
  asyncHandler(getStudentTimetableHandler)
);

export default router;
