import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getParentStudentsHandler,
  getParentTimetableHandler,
} from "./parent-timetable.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("parent"));

router.get(
  "/students",
  asyncHandler(getParentStudentsHandler)
);

router.get(
  "/",
  asyncHandler(getParentTimetableHandler)
);

export default router;
