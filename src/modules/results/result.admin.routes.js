import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getAdminResultsOverviewHandler,
  getClassPerformanceHandler,
   getAdminDashboardHandler,
} from "./admin.result.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));
router.get("/admin/dashboard", getAdminDashboardHandler);

router.get(
  "/overview",
  asyncHandler(getAdminResultsOverviewHandler)
);

router.get(
  "/class-performance",
  asyncHandler(getClassPerformanceHandler)
);

export default router;