
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
} from "./billing.controller.js";

const router = express.Router();

// Every endpoint in this router requires an authenticated Super Admin.
router.use(protect);
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
