import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  exportAttendanceHandler,
  exportInvoicesHandler,
  exportResultsHandler,
  exportStudentsHandler,
} from "./export.controller.js";

const router = express.Router();

router.use(protect);

router.get(
  "/students",
  authorize("super_admin", "school_admin"),
  asyncHandler(exportStudentsHandler)
);

router.get(
  "/results",
  authorize("super_admin", "school_admin"),
  asyncHandler(exportResultsHandler)
);

router.get(
  "/attendance",
  authorize("super_admin", "school_admin"),
  asyncHandler(exportAttendanceHandler)
);

router.get(
  "/invoices",
  authorize("super_admin"),
  asyncHandler(exportInvoicesHandler)
);

export default router;