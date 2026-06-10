import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { tenantScope } from "../../middlewares/tenantScope.middleware.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createFeePlanHandler,
  assignFeeToStudentHandler,
  generateInvoiceHandler,
  listInvoicesHandler,
  listPaymentsHandler,
  recordManualPaymentHandler,
  cancelPaymentHandler,
} from "./fee-payment.controller.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect);
router.use(authorize("school_admin"));
router.use(tenantScope);

/* =========================================
   FEE PLANS
========================================= */
router.post(
  "/plans",
  asyncHandler(createFeePlanHandler)
);

/* =========================================
   ASSIGN FEES
========================================= */
router.post(
  "/assign",
  asyncHandler(assignFeeToStudentHandler)
);

/* =========================================
   INVOICES
========================================= */
router.post(
  "/invoice/generate",
  asyncHandler(generateInvoiceHandler)
);

router.get(
  "/invoices",
  asyncHandler(listInvoicesHandler)
);

/* 👉 NEW: invoice drilldown (IMPORTANT FOR SAAS + PARENTS) */
router.get(
  "/invoices/:id"
);

/* =========================================
   PAYMENTS
========================================= */
router.get(
  "/payments",
  asyncHandler(listPaymentsHandler)
);

/* 👉 NEW: payment detail view */
router.get(
  "/payments/:id"
);

router.post(
  "/payments/manual",
  asyncHandler(recordManualPaymentHandler)
);

/* =========================================
   CANCEL PAYMENT (FIXED METHOD)
========================================= */
router.patch(
  "/payments/:id/cancel",
  asyncHandler(cancelPaymentHandler)
);

export default router;