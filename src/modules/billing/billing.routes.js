
import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createInvoiceHandler,
  createManualPaymentHandler,
  createSubscriptionHandler,
  deleteSubscriptionHandler,
  getInvoiceHandler,
  getPaymentHandler,
  getSubscriptionHandler,
  listInvoicesHandler,
  listPaymentsHandler,
  listSubscriptionsHandler,
  updateSubscriptionHandler,
  getCurrentBillingHandler,
  verifyPaystackHandler,
  getBillingHistoryHandler,
  upgradeSubscriptionHandler,
  initializeBillingPaymentHandler,
} from "./billing.controller.js";

const router = express.Router();

// Keep existing school billing/payment initialization behavior.
router.post(
  "/paystack/initialize",
  protect,
  authorize("school_admin"),
  asyncHandler(initializeBillingPaymentHandler)
);

router.get(
  "/paystack/verify/:reference",
  asyncHandler(verifyPaystackHandler)
);

// Existing billing routes require authentication.
router.use(protect);

// School-specific billing routes.
router.get(
  "/current",
  authorize("school_admin", "super_admin"),
  asyncHandler(getCurrentBillingHandler)
);

router.get(
  "/history",
  authorize("school_admin", "super_admin"),
  asyncHandler(getBillingHistoryHandler)
);

router.post(
  "/upgrade",
  authorize("school_admin", "super_admin"),
  asyncHandler(upgradeSubscriptionHandler)
);

// All management routes below require Super Admin access.
// Authorization must come BEFORE these handlers.
router.use(authorize("super_admin"));

// Subscriptions
router.get(
  "/subscriptions",
  asyncHandler(listSubscriptionsHandler)
);

router.post(
  "/subscriptions",
  asyncHandler(createSubscriptionHandler)
);

router.get(
  "/subscriptions/:id",
  asyncHandler(getSubscriptionHandler)
);

router.put(
  "/subscriptions/:id",
  asyncHandler(updateSubscriptionHandler)
);

router.patch(
  "/subscriptions/:id",
  asyncHandler(updateSubscriptionHandler)
);

router.delete(
  "/subscriptions/:id",
  asyncHandler(deleteSubscriptionHandler)
);

// Payments
router.get(
  "/payments",
  asyncHandler(listPaymentsHandler)
);

router.post(
  "/payments",
  asyncHandler(createManualPaymentHandler)
);

router.get(
  "/payments/:id",
  asyncHandler(getPaymentHandler)
);

// Invoices
router.get(
  "/invoices",
  asyncHandler(listInvoicesHandler)
);

router.post(
  "/invoices",
  asyncHandler(createInvoiceHandler)
);

router.get(
  "/invoices/:id",
  asyncHandler(getInvoiceHandler)
);

export default router;
