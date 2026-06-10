import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";
import { School } from "../schools/school.model.js";
import { Subscription } from "./subscription.model.js";
import { SubPayment } from "./sub-payment.model.js";

/**
 * =========================
 * SAFE PAYSTACK REQUEST
 * =========================
 */
async function paystackRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok || data.status === false) {
    throw new ApiError(400, data.message || "Paystack error");
  }

  return data;
}

/**
 * =========================
 * INIT PAYMENT (FIXED)
 * =========================
 */
export async function initializePaystackPayment(payload) {
  const metadata = {
    ...(payload.metadata || {}),
  };

  /**
   * 🔥 FIX 1: STRICT NUMBER NORMALIZATION
   */
  let amountInNaira = payload.amount;

  if (amountInNaira === undefined || amountInNaira === null) {
    throw new ApiError(400, "Amount is required");
  }

  amountInNaira = Number(amountInNaira);

  if (Number.isNaN(amountInNaira)) {
    throw new ApiError(400, "Amount must be a valid number");
  }

  if (amountInNaira <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  /**
   * 🔥 FIX 2: Convert to kobo safely (Paystack requirement)
   */
  const amountInKobo = Math.round(amountInNaira * 100);

  /**
   * 🔥 DEBUG (temporary but important)
   */
  console.log("PAYSTACK AMOUNT DEBUG:", {
    naira: amountInNaira,
    kobo: amountInKobo,
    email: payload.email,
  });

  const response = await paystackRequest(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        amount: amountInKobo,
        callback_url: payload.callbackUrl,
        metadata,
      }),
    }
  );

  if (!response?.data?.authorization_url) {
    throw new ApiError(500, "Paystack failed to initialize payment");
  }

  return {
    authorizationUrl: response.data.authorization_url,
    reference: response.data.reference,
    accessCode: response.data.access_code,
  };
}
/**
 * =========================
 * VERIFY PAYMENT
 * =========================
 */
export async function verifyPaystackPayment(reference) {
  return await paystackRequest(
    `https://api.paystack.co/transaction/verify/${reference}`
  );
}

/**
 * =========================
 * WEBHOOK (UNCHANGED BUT SAFE)
 * =========================
 */
export async function handlePaystackWebhook(event) {
  if (event.event !== "charge.success") return;

  const data = event.data;
  const metadata = data.metadata;

  if (!metadata?.onboarding) return;

  const onboarding = metadata.onboarding;

  const school = await School.create({
    name: onboarding.schoolName,
    slug: onboarding.schoolName.toLowerCase().replace(/\s+/g, "-"),
    email: onboarding.adminEmail,
    phone: onboarding.phone || "",
    address: onboarding.address || "",
    subscriptionPlan: onboarding.plan,
    subscriptionStatus: "active",
    onboardingStatus: "active",
    isActive: true,
  });

  const subscription = await Subscription.create({
    schoolId: school._id,
    plan: onboarding.plan,
    amount: data.amount / 100,
    billingCycle: onboarding.billingCycle,
    status: "active",
    startsAt: new Date(),
    expiresAt: null,
  });

  school.subscriptionStatus = "active";
  school.subscriptionPlan = onboarding.plan;
  await school.save();

  await Payment.create({
    schoolId: school._id,
    amount: data.amount / 100,
    method: "paystack",
    reference: data.reference,
    status: "success",
    subscriptionId: subscription._id,
  });
}