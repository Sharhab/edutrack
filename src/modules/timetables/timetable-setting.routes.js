import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createTimetableSettingHandler,
  deleteTimetableSettingHandler,
  getTimetableSettingHandler,
  updateTimetableSettingHandler,
} from "./timetable-setting.controller.js";

const router = express.Router();

router.use(protect);

/*
 * School administrators can create, update and delete
 * timetable settings.
 */
router.post(
  "/",
  authorize("school_admin"),
  asyncHandler(createTimetableSettingHandler)
);

router.put(
  "/:id",
  authorize("school_admin"),
  asyncHandler(updateTimetableSettingHandler)
);

router.delete(
  "/:id",
  authorize("school_admin"),
  asyncHandler(deleteTimetableSettingHandler)
);

/*
 * School administrators and teachers can read
 * timetable settings.
 */
router.get(
  "/",
  authorize("school_admin", "teacher", "parent"),
  asyncHandler(getTimetableSettingHandler)
);

export default router;
