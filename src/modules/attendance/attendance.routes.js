
import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  markAttendanceHandler,
  listAttendanceHandler,
  getAttendanceHandler,
  getAttendanceByClassDateHandler,
  updateAttendanceHandler,
  deleteAttendanceHandler,
} from "./attendance.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin", "teacher"));

// Mark attendance for a class.
router.post("/", asyncHandler(markAttendanceHandler));

// List attendance with optional class, student, date,
// session, and term filters.
router.get("/", asyncHandler(listAttendanceHandler));

// Retrieve attendance for a class on a particular date.
// Keep this route before "/:id".
router.get(
  "/class/:classId/date/:date",
  asyncHandler(getAttendanceByClassDateHandler)
);

// Retrieve one attendance record.
router.get("/:id", asyncHandler(getAttendanceHandler));

// Update one attendance record.
router.put("/:id", asyncHandler(updateAttendanceHandler));

// Delete attendance (service restricts this to school admins).
router.delete("/:id", asyncHandler(deleteAttendanceHandler));

export default router;
