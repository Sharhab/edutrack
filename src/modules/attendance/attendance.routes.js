import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  markAttendanceHandler,
  listAttendanceHandler,
  getAttendanceHandler,
  updateAttendanceHandler,
  deleteAttendanceHandler,
} from "./attendance.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin", "teacher"));

router.post("/", asyncHandler(markAttendanceHandler));
router.get("/", asyncHandler(listAttendanceHandler));
router.get("/:id", asyncHandler(getAttendanceHandler));
router.put("/:id", asyncHandler(updateAttendanceHandler));
router.delete("/:id", asyncHandler(deleteAttendanceHandler));

export default router;