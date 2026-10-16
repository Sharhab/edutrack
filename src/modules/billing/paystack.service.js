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
  if (event?.event !== "charge.success") {
    return { ignored: true };
  }

  const reference = String(event?.data?.reference || "").trim();

  if (!reference) {
    throw new ApiError(400, "Missing Paystack payment reference");
  }

  // Find the payment created during initialization.
  const paymentRecord = await SubPayment.findOne({ reference });

  if (!paymentRecord) {
    throw new ApiError(
      404,
      "No recorded subscription payment exists for this reference"
    );
  }

  // Idempotency: do not activate or record the same payment twice.
  if (paymentRecord.status === "success") {
    return {
      alreadyProcessed: true,
      reference,
    };
  }

  // Verify directly with Paystack; never trust webhook amount/status alone.
  const verification = await verifyPaystackPayment(reference);
  const transaction = verification?.data;

  if (
    verification?.status !== true ||
    transaction?.status !== "success" ||
    String(transaction?.reference) !== reference ||
    String(transaction?.currency).toUpperCase() !== "NGN"
  ) {
    throw new ApiError(409, "Paystack transaction verification failed");
  }

  const verifiedAmount = Number(transaction.amount) / 100;

  if (
    !Number.isFinite(verifiedAmount) ||
    verifiedAmount <= 0 ||
    Math.abs(verifiedAmount - Number(paymentRecord.amount)) > 0.01
  ) {
    throw new ApiError(
      409,
      "Verified payment amount does not match the recorded payment"
    );
  }

  const school = await School.findById(paymentRecord.schoolId);

  if (!school) {
    throw new ApiError(404, "School linked to payment was not found");
  }

  const subscription = paymentRecord.subscriptionId
    ? await Subscription.findOne({
        _id: paymentRecord.subscriptionId,
        schoolId: school._id,
      })
    : await Subscription.findOne({
        schoolId: school._id,
      }).sort({ createdAt: -1 });

  if (!subscription) {
    throw new ApiError(
      404,
      "Subscription linked to payment was not found"
    );
  }

  const now = new Date();

  const cycleDays = {
    monthly: 30,
    quarterly: 90,
    yearly: 365,
  };

  const days = cycleDays[subscription.billingCycle];

  if (!days) {
    throw new ApiError(400, "Invalid subscription billing cycle");
  }

  // Extend from the later of today or the current valid expiry.
  const currentExpiry = subscription.expiresAt
    ? new Date(subscription.expiresAt)
    : null;

  const startsAt =
    currentExpiry && currentExpiry > now
      ? currentExpiry
      : now;

  const expiresAt = new Date(
    startsAt.getTime() + days * 24 * 60 * 60 * 1000
  );

  // Record payment success.
  paymentRecord.status = "success";
  paymentRecord.paidAt = transaction.paid_at
    ? new Date(transaction.paid_at)
    : now;
  paymentRecord.gatewayResponse = {
    status: transaction.status,
    reference: transaction.reference,
    amount: transaction.amount,
    currency: transaction.currency,
    paid_at: transaction.paid_at,
  };

  // Activate the associated paid subscription.
  subscription.status = "active";
  subscription.isTrial = false;
  subscription.startsAt = startsAt;
  subscription.expiresAt = expiresAt;
  subscription.trialEndsAt = null;
  subscription.amount = verifiedAmount;

  school.plan = subscription.plan;
  school.billingCycle = subscription.billingCycle;
  school.subscriptionStatus = "active";
  school.billingStatus = "active";
  school.subscriptionStartedAt = startsAt;
  school.subscriptionExpiresAt = expiresAt;
  school.trialStartAt = null;
  school.trialEndsAt = null;
  school.onboardingStatus = "active";
  school.isActive = true;

  await Promise.all([
    paymentRecord.save(),
    subscription.save(),
    school.save(),
  ]);

  return {
    processed: true,
    reference,
    schoolId: String(school._id),
    subscriptionStatus: subscription.status,
    expiresAt,
  };
}
