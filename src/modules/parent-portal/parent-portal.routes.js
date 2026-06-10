import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  parentDashboardHandler,
  getMyChildrenHandler,
  getChildFinanceHandler,
  getChildInvoicesHandler,
  getChildResultsHandler,
} from "./parent-portal.controller.js";

const router = express.Router();

/**
 * =====================================
 * AUTH
 * =====================================
 */
router.use(protect);

/**
 * =====================================
 * DASHBOARD
 * =====================================
 */
router.get(
  "/dashboard",
  asyncHandler(parentDashboardHandler)
);

/**
 * =====================================
 * CHILDREN
 * =====================================
 */
router.get(
  "/children",
  asyncHandler(getMyChildrenHandler)
);

/**
 * =====================================
 * CHILD FINANCE
 * =====================================
 */
router.get(
  "/children/:studentId/summary",
  asyncHandler(getChildFinanceHandler)
);

router.get(
  "/portal",
  asyncHandler(parentDashboardHandler)
);

/**
 * =====================================
 * CHILD INVOICES
 * =====================================
 */
router.get(
  "/children/:studentId/invoices",
  asyncHandler(getChildInvoicesHandler)
);

/**
 * =====================================
 * CHILD RESULTS
 * =====================================
 */
router.get(
  "/children/:studentId/results",
  asyncHandler(getChildResultsHandler)
);

export default router;