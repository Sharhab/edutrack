
import express from "express";

import { protect } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/role.middleware.js";
import { tenantScope } from "../../../middlewares/tenantScope.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { paystackWebhookHandler } from "../payments/webhook.controller.js";

import {
  createFeePlanHandler,
  updateFeePlanHandler,
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
   PAYSTACK WEBHOOK
   Must be registered before authentication.
   The handler validates the Paystack signature.
========================================= */

router.post(
  "/payments/paystack/webhook",
  asyncHandler(paystackWebhookHandler)
);

/* =========================================
   AUTHENTICATION AND TENANT SCOPE
   Applies to all routes below this point.
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


router.patch(
  "/plans/:id",
  authorize("school_admin", "super_admin"),
  asyncHandler(updateFeePlanHandler)
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

router.get(
  "/invoices",
  asyncHandler(getInvoices)
);

router.get(
  "/invoices/student/:studentId",
  asyncHandler(getStudentInvoicesHandler)
);

router.get(
  "/invoices/class/:classId",
  asyncHandler(getClassInvoicesHandler)
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

router.patch(
  "/payments/:id/cancel",
  asyncHandler(cancelPaymentHandler)
);

export default router;
