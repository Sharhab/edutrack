import express from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";

import {
  initializePaystackHandler,
  verifyPaystackHandler,
  getPaystackBanksHandler,
  resolveSchoolPaystackAccountHandler,
  connectSchoolPaystackHandler,
} from "./paystack.controller.js";

import { paystackWebhookHandler } from "./webhook.controller.js";
import { protect } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/role.middleware.js";

const router = express.Router();

/**
 * =========================
 * PARENT PAYMENT ROUTES
 * =========================
 */

// Initialize a parent school-fee payment
router.post(
  "/initialize",
  protect,
  asyncHandler(initializePaystackHandler)
);

// Verify a parent payment after Paystack redirects back
router.get(
  "/verify/:reference",
  protect,
  asyncHandler(verifyPaystackHandler)
);

/**
 * =========================
 * PAYSTACK WEBHOOK
 * =========================
 */

// Paystack calls this directly; no user authentication
router.post(
  "/webhook",
  asyncHandler(paystackWebhookHandler)
);

/**
 * =========================
 * SCHOOL ADMIN PAYMENT SETTINGS
 * =========================
 */

router.get(
  "/banks",
  protect,
  authorize("school_admin"),
  asyncHandler(getPaystackBanksHandler)
);

// Verify bank account and retrieve its registered account name
router.post(
  "/resolve-account",
  protect,
  authorize("school_admin"),
  asyncHandler(resolveSchoolPaystackAccountHandler)
);

// Create and connect the school's Paystack subaccount
router.post(
  "/connect",
  protect,
  authorize("school_admin"),
  asyncHandler(connectSchoolPaystackHandler)
);

export default router;
