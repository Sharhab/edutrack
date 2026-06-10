import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  onboardingHandler,
  onboardingInitializeHandler,
  onboardingVerifyPaymentHandler,
  onboardingWebhookHandler,
} from "./onboarding.controller.js";

const router = express.Router();

/**
 * CREATE SCHOOL + ADMIN
 */
router.post(
  "/",
  asyncHandler(onboardingHandler)
);

/**
 * INITIALIZE PAYSTACK PAYMENT
 */
router.post(
  "/paystack/initialize",
  asyncHandler(onboardingInitializeHandler)
);

/**
 * VERIFY PAYMENT
 * PUBLIC
 */

router.get(
  "/paystack/verify/:reference",
  onboardingVerifyPaymentHandler
);

/**
 * PAYSTACK WEBHOOK
 * PUBLIC
 */
router.post(
  "/paystack/webhook",
  onboardingWebhookHandler
);

export default router;