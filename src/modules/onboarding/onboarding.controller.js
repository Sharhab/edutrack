import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import {
  completeOnboarding,
  initializeOnboardingPayment,
} from "./onboarding.service.js";
import { verifyPaystackPayment } from "../billing/paystack.service.js";


import { handlePaystackWebhook } from "../billing/paystack.service.js";


export async function onboardingWebhookHandler(req, res) {
  try {
    const signature = req.headers["x-paystack-signature"];
    const secretKey = env.PAYSTACK_SECRET_KEY;
    const rawBody = req.rawBody;

    if (!secretKey || !Buffer.isBuffer(rawBody)) {
      console.error(
        "Paystack webhook rejected: secret or raw body unavailable"
      );

      return res.status(400).json({
        success: false,
        message: "Webhook could not be validated",
      });
    }

    if (
      typeof signature !== "string" ||
      !/^[a-f0-9]{128}$/i.test(signature)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const expectedSignature = createHmac("sha512", secretKey)
      .update(rawBody)
      .digest();

    const receivedSignature = Buffer.from(signature, "hex");

    if (
      receivedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(receivedSignature, expectedSignature)
    ) {
      console.warn("Paystack webhook rejected: signature mismatch");

      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    await handlePaystackWebhook(req.body);

    return res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("ONBOARDING WEBHOOK ERROR:", {
      message: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
}

/**
 * CREATE SCHOOL + ADMIN
 */
export async function onboardingHandler(req, res) {
  try {
    const data = await completeOnboarding(req.body);

    return res.status(201).json({
      success: true,
      message: "School onboarding completed successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * INITIALIZE PAYMENT
 */
export async function onboardingInitializeHandler(req, res) {
  try {
    const data = await initializeOnboardingPayment(
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      ...data,
    });
  } catch (err) {
  console.error("PAYSTACK INIT ERROR:", err.response?.data || err);

  return res.status(500).json({
    success: false,
    message: "Paystack initialization failed",
    error: err.message,
  });
}
}


export async function onboardingVerifyPaymentHandler(req, res) {
  const { reference } = req.params;

  const result = await verifyPaystackPayment(reference);

  return res.json({
    success: true,
    data: result.data,
  });
}
