import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  initializePaystackHandler,
  verifyPaystackHandler,
  paystackWebhookHandler,
} from "./paystack.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";

const router = express.Router();

/**
 * =========================================
 * PUBLIC ROUTES
 * =========================================
 * These MUST be public because:
 *
 * 1. New schools are not logged in yet
 * 2. Paystack redirect must access verify
 * 3. Paystack webhook cannot send auth token
 */

/**
 * Initialize onboarding payment
 */
router.post(
  "/initialize",
  asyncHandler(initializePaystackHandler)
);

/**
 * Verify payment after redirect
 */
router.get(
  "/verify/:reference",
  asyncHandler(verifyPaystackHandler)
);

/**
 * Paystack webhook
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(paystackWebhookHandler)
);

/**
 * =========================================
 * PROTECTED ADMIN ROUTES
 * =========================================
 */

router.use(protect);
router.use(authorize("super_admin"));

/**
 * Example future admin routes
 */
// router.get("/transactions", asyncHandler(getTransactions));

export default router;