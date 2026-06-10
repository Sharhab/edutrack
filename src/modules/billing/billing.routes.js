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

/**
 * =========================================
 * PUBLIC BILLING ROUTES
 * =========================================
 * Used during onboarding/payment flow
 */

/**
 * INITIALIZE PAYSTACK PAYMENT
 */
router.post(
  "/paystack/initialize",
  protect,
  authorize("school_admin"),
  asyncHandler(
    initializeBillingPaymentHandler
  )
);

/**
 * VERIFY PAYMENT
 */
router.get(
  "/paystack/verify/:reference",
  asyncHandler(
    verifyPaystackHandler
  )
);

/**
 * =========================================
 * SUPER ADMIN ROUTES
 * =========================================
 */
router.use(protect);

/**
 * =========================================
 * AUTHENTICATED BILLING ROUTES
 * =========================================
 */
router.get(
  "/current",
  protect,
  authorize(
    "school_admin",
    "super_admin"
  ),
  asyncHandler(
    getCurrentBillingHandler
  )
);

router.get(
  "/history",
  protect,
  authorize(
    "school_admin",
    "super_admin"
  ),
  asyncHandler(
    getBillingHistoryHandler
  )
);

router.post(
  "/upgrade",
  protect,
  authorize(
    "school_admin",
    "super_admin"
  ),
  asyncHandler(
    upgradeSubscriptionHandler
  )
);


/**
 * SUBSCRIPTIONS
 */
router.get(
  "/subscriptions",
  asyncHandler(
    listSubscriptionsHandler
  )
);

router.post(
  "/subscriptions",
  asyncHandler(
    createSubscriptionHandler
  )
);

router.get(
  "/subscriptions/:id",
  asyncHandler(
    getSubscriptionHandler
  )
);


router.patch(
  "/subscriptions/:id",
  asyncHandler(
    updateSubscriptionHandler
  )
);

router.delete(
  "/subscriptions/:id",
  asyncHandler(
    deleteSubscriptionHandler
  )
);

/**
 * PAYMENTS
 */
router.get(
  "/payments",
  asyncHandler(
    listPaymentsHandler
  )
);

router.post(
  "/payments",
  asyncHandler(
    createManualPaymentHandler
  )
);

router.get(
  "/payments/:id",
  asyncHandler(
    getPaymentHandler
  )
);

/**
 * INVOICES
 */
router.get(
  "/invoices",
  asyncHandler(
    listInvoicesHandler
  )
);

router.post(
  "/invoices",
  asyncHandler(
    createInvoiceHandler
  )
);

router.get(
  "/invoices/:id",
  asyncHandler(
    getInvoiceHandler
  )
);

router.use(
  authorize("super_admin")
);

export default router;