import {
  completeOnboarding,
  initializeOnboardingPayment,
} from "./onboarding.service.js";
import { verifyPaystackPayment } from "../billing/paystack.service.js";


import { handlePaystackWebhook } from "../billing/paystack.service.js";

export async function onboardingWebhookHandler(req, res) {
  try {
    await handlePaystackWebhook(req.body);

    return res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook failed",
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