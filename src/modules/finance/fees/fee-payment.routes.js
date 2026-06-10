import express from "express";

import { protect } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/role.middleware.js";
import { tenantScope } from "../../../middlewares/tenantScope.middleware.js";

import { asyncHandler } from "../../../utils/asyncHandler.js";
import {   paystackWebhookHandler } from "../payments/webhook.controller.js"
import {
  createFeePlanHandler,
  assignFeeToStudentHandler,
  assignFeeToClassHandler,
  generateInvoiceHandler,
  getSchoolInvoices,
  getStudentInvoicesHandler,
  getClassInvoicesHandler,
  listPaymentsHandler,
  recordManualPaymentHandler,
  cancelPaymentHandler,
  getFeePlansHandler,
  getInvoiceById,
  getInvoices,
} from "./fee-payment.controller.js";

const router = express.Router();

/* =========================================
   AUTH
========================================= */
router.use(protect);

router.use(
  authorize(
    "school_admin",
    "parent",
    "super_admin"
  )
);

router.use(tenantScope);

/* =========================================
   FEE PLANS
========================================= */
router.post(
  "/plans",
  asyncHandler(createFeePlanHandler)
);

router.get(
  "/plans",
  asyncHandler(getFeePlansHandler)
);

/* =========================================
   ASSIGN FEES
========================================= */
router.post(
  "/assign-student",
  asyncHandler(assignFeeToStudentHandler)
);

router.post(
  "/assign-class",
  asyncHandler(assignFeeToClassHandler)
);

/* =========================================
   INVOICES
========================================= */

/**
 * THESE BECOME:
 * /api/finance/fees/invoices
 * /api/finance/fees/invoices/:id
 */

/* ======================================
   GET RECEIPT BY PAYMENT
====================================== */
router.get(
  "/invoices",
  asyncHandler(getInvoices)
);

router.get(
  "/invoices/:id",
  asyncHandler(getInvoiceById)
);

router.post(
  "/invoice/generate",
  asyncHandler(generateInvoiceHandler)
);

router.get(
  "/school-invoices",
  asyncHandler(getSchoolInvoices)
);

/* =========================================
   OPTIONAL INVOICE LOOKUP
========================================= */
router.get(
  "/invoices/student/:studentId",
  asyncHandler(getStudentInvoicesHandler)
);

router.get(
  "/invoices/class/:classId",
  asyncHandler(getClassInvoicesHandler)
);

/* =========================================
   PAYMENTS
========================================= */
router.get(
  "/payments",
  asyncHandler(listPaymentsHandler)
);

router.post(
  "/payments/manual",
  asyncHandler(recordManualPaymentHandler)
);


// Paystack webhook (NO auth usually)
router.post(
  "/payments/paystack/webhook",
  paystackWebhookHandler
);
/* =========================================
   CANCEL PAYMENT
========================================= */
router.patch(
  "/payments/:id/cancel",
  asyncHandler(cancelPaymentHandler)
);

export default router;