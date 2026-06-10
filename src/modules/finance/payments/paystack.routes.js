import express from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";

import {
  initializePaystackHandler,
  verifyPaystackHandler,

} from "./paystack.controller.js";
import {   paystackWebhookHandler } from "./webhook.controller.js"
import { protect } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/role.middleware.js";

const router = express.Router();

/**
 * =========================
 * PUBLIC PAYMENT ROUTES
 * =========================
 */

// initialize payment
router.post(
  "/initialize",
  asyncHandler(initializePaystackHandler)
);

// verify payment
router.get(
  "/verify/:reference",
  asyncHandler(verifyPaystackHandler)
);

// webhook (NO AUTH)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(paystackWebhookHandler)
);

/**
 * =========================
 * ADMIN ONLY (optional)
 * =========================
 */
router.use(protect);
router.use(authorize("super_admin"));

export default router;