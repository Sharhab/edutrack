import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";


import {
  onboardingHandler,
  onboardingInitializeHandler,
  onboardingVerifyPaymentHandler,
  onboardingWebhookHandler,
  onboardingTrialHandler,
} from "./onboarding.controller.js";
import { uploadLogo } from "../../utils/upload.js";

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
  "/trial",
  uploadLogo.single("logo"),
  asyncHandler(onboardingTrialHandler)
);

router.post(
  "/paystack/initialize",
  uploadLogo.single("logo"),
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
