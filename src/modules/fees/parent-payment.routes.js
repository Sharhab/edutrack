import express from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { protect } from "../../middlewares/auth.middleware.js";

import { authorize } from "../../middlewares/role.middleware.js";

import {
  getParentChildrenHandler,
  getParentInvoicesHandler,
  initializeParentPaymentHandler,
  verifyParentPaymentHandler,
} from "./parent-payment.controller.js";

const router = express.Router();

/**
 * =========================================
 * PARENT ONLY
 * =========================================
 */
router.use(protect);

router.use(
  authorize("parent")
);

/**
 * =========================================
 * GET CHILDREN
 * =========================================
 */
router.get(
  "/children",
  asyncHandler(
    getParentChildrenHandler
  )
);

/**
 * =========================================
 * GET CHILD INVOICES
 * =========================================
 */
router.get(
  "/children/:studentId/invoices",
  asyncHandler(
    getParentInvoicesHandler
  )
);

/**
 * =========================================
 * INIT PAYMENT
 * =========================================
 */
router.post(
  "/initialize-payment",
  asyncHandler(
    initializeParentPaymentHandler
  )
);

/**
 * =========================================
 * VERIFY PAYMENT
 * =========================================
 */
router.get(
  "/verify/:reference",
  asyncHandler(
    verifyParentPaymentHandler
  )
);

export default router;