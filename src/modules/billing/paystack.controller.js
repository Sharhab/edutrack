import crypto from "crypto";

import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";

import {
  initializePaystackPayment,
  verifyPaystackPayment,
  handlePaystackWebhook,
} from "./paystack.service.js";

/**
 * =========================================
 * INITIALIZE PAYMENT
 * =========================================
 */
export async function initializePaystackHandler(
  req,
  res
) {
  const payment =
    await initializePaystackPayment(
      req.body
    );

  return res.status(200).json({
    success: true,
    message:
      "Payment initialized successfully",
    data: payment,
  });
}

/**
 * =========================================
 * VERIFY PAYMENT
 * =========================================
 */
export async function verifyPaystackHandler(
  req,
  res
) {
  const { reference } = req.params;

  if (!reference) {
    throw new ApiError(
      400,
      "Payment reference is required"
    );
  }

  const payment =
    await verifyPaystackPayment(
      reference
    );

  return res.status(200).json({
    success: true,
    message:
      "Payment verified successfully",
    data: payment,
  });
}

/**
 * =========================================
 * PAYSTACK WEBHOOK
 * =========================================
 */
export async function paystackWebhookHandler(
  req,
  res
) {
  try {
    /**
     * VERIFY PAYSTACK SIGNATURE
     */
    const hash =
      crypto
        .createHmac(
          "sha512",
          env.PAYSTACK_SECRET_KEY
        )
        .update(
          JSON.stringify(req.body)
        )
        .digest("hex");

    const signature =
      req.headers[
        "x-paystack-signature"
      ];

    if (hash !== signature) {
      console.log(
        "❌ Invalid Paystack signature"
      );

      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid signature",
        });
    }

    /**
     * PROCESS WEBHOOK
     */
    await handlePaystackWebhook(
      req.body
    );

    console.log(
      "✅ Paystack webhook processed"
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(
      "❌ WEBHOOK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Webhook processing failed",
    });
  }
}