
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";
import { School } from "../schools/school.model.js";
import { Subscription } from "./subscription.model.js";
import { SubPayment } from "./sub-payment.model.js";
import { sendSubscriptionPaymentReceiptEmail } from "../../services/email.service.js";
/**
 * =========================================
 * SAFE PAYSTACK REQUEST
 * =========================================
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

  let data;

  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      502,
      "Invalid response received from Paystack"
    );
  }

  if (!response.ok || data.status === false) {
    throw new ApiError(
      response.status || 400,
      data.message || "Paystack request failed"
    );
  }

  return data;
}

/**
 * =========================================
 * INITIALIZE PAYSTACK PAYMENT
 * Amount is accepted in Naira and converted
 * to kobo exactly once.
 * =========================================
 */
export async function initializePaystackPayment(payload) {
  const email = String(payload.email || "").trim().toLowerCase();

  if (!email) {
    throw new ApiError(400, "Payment email is required");
  }

  const amountInNaira = Number(payload.amount);

  if (
    !Number.isFinite(amountInNaira) ||
    amountInNaira <= 0
  ) {
    throw new ApiError(
      400,
      "Amount must be a valid positive number"
    );
  }

  if (
    payload.reference !== undefined &&
    (
      typeof payload.reference !== "string" ||
      !payload.reference.trim()
    )
  ) {
    throw new ApiError(400, "Invalid payment reference");
  }

  const amountInKobo = Math.round(amountInNaira * 100);

  if (!Number.isSafeInteger(amountInKobo) || amountInKobo <= 0) {
    throw new ApiError(400, "Invalid payment amount");
  }

  const metadata = {
    ...(payload.metadata || {}),
  };

  const requestBody = {
    email,
    amount: amountInKobo,
    callback_url: payload.callbackUrl,
    metadata,
  };

  // Preserve compatibility with existing payment callers.
  if (payload.reference) {
    requestBody.reference = payload.reference.trim();
  }

  const response = await paystackRequest(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    }
  );

  if (
    !response?.data?.authorization_url ||
    !response?.data?.reference
  ) {
    throw new ApiError(
      502,
      "Paystack did not return a valid checkout response"
    );
  }

  if (
    payload.reference &&
    response.data.reference !== payload.reference.trim()
  ) {
    throw new ApiError(
      502,
      "Paystack returned a different payment reference"
    );
  }

  return {
    authorizationUrl: response.data.authorization_url,
    reference: response.data.reference,
    accessCode: response.data.access_code,
  };
}

/**
 * =========================================
 * VERIFY PAYSTACK PAYMENT
 * =========================================
 */
export async function verifyPaystackPayment(reference) {
  const safeReference = String(reference || "").trim();

  if (!safeReference) {
    throw new ApiError(400, "Payment reference is required");
  }

  return paystackRequest(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(
      safeReference
    )}`
  );
}

/**
 * =========================================
 * CALCULATE SUBSCRIPTION EXPIRY
 * Calendar-based billing periods.
 * =========================================
 */
function calculateSubscriptionExpiry(startDate, billingCycle) {
  const expiry = new Date(startDate);

  if (billingCycle === "monthly") {
    expiry.setMonth(expiry.getMonth() + 1);
  } else if (billingCycle === "quarterly") {
    expiry.setMonth(expiry.getMonth() + 3);
  } else if (billingCycle === "yearly") {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    throw new ApiError(400, "Invalid subscription billing cycle");
  }

  return expiry;
}
/**
 * =========================================
 * SEND RECEIPT AFTER VERIFIED PAYMENT
 * =========================================
 */
async function sendVerifiedSubscriptionReceipt(paymentRecord, school) {
  if (
    paymentRecord.status !== "success" ||
    paymentRecord.metadata?.purpose !== "edutrack_subscription"
  ) {
    return;
  }

  // Assign the receipt number once and persist it.
  if (!paymentRecord.receiptNumber) {
    paymentRecord.receiptNumber =
      `EDU-RCP-${String(paymentRecord._id).slice(-8).toUpperCase()}`;

    await paymentRecord.save();
  }

  // Do not resend a receipt already marked as sent.
  if (paymentRecord.receiptEmailStatus === "sent") {
    return;
  }

  if (!school?.email) {
    paymentRecord.receiptEmailStatus = "failed";
    paymentRecord.receiptEmailError =
      "The school's registered email address is missing.";

    await paymentRecord.save();
    return;
  }

  try {
    paymentRecord.receiptEmailStatus = "pending";
    paymentRecord.receiptEmailError = "";
    await paymentRecord.save();

    const result = await sendSubscriptionPaymentReceiptEmail({
      to: school.email,
      schoolName: school.name,
      receiptNumber: paymentRecord.receiptNumber,
      reference: paymentRecord.reference,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency || "NGN",
      plan: paymentRecord.metadata?.plan || "EduTrack subscription",
      billingCycle: paymentRecord.metadata?.billingCycle || "",
      paidAt: paymentRecord.paidAt,
    });

    if (!result?.success) {
      throw new Error(
        result?.reason ||
        result?.error?.message ||
        "The email provider did not confirm delivery."
      );
    }

    paymentRecord.receiptEmailStatus = "sent";
    paymentRecord.receiptEmailSentAt = new Date();
    paymentRecord.receiptEmailError = "";
    await paymentRecord.save();
  } catch (error) {
    // Email failure must never reverse a verified payment.
    paymentRecord.receiptEmailStatus = "failed";
    paymentRecord.receiptEmailError = String(
      error?.message || "Receipt email failed"
    ).slice(0, 1000);

    await paymentRecord.save();

    console.error(
      "Subscription receipt email failed:",
      paymentRecord.reference,
      error
    );
  }
}
/**
 * =========================================
 * HANDLE PAYSTACK SUBSCRIPTION WEBHOOK
 *
 * Supports:
 * - new_subscription
 * - upgrade
 * - renewal
 *
 * The controller must verify the Paystack
 * webhook signature before calling this.
 * =========================================
 */
export async function handlePaystackWebhook(event) {
  if (event?.event !== "charge.success") {
    return { ignored: true };
  }

  const reference = String(
    event?.data?.reference || ""
  ).trim();

  if (!reference) {
    throw new ApiError(
      400,
      "Missing Paystack payment reference"
    );
  }

  const paymentRecord = await SubPayment.findOne({
    reference,
  });

  if (!paymentRecord) {
    throw new ApiError(
      404,
      "No recorded subscription payment exists for this reference"
    );
  }

  if (
    paymentRecord.metadata?.purpose !== "edutrack_subscription"
  ) {
    throw new ApiError(
      400,
      "Payment reference is not an EduTrack subscription payment"
    );
  }

  // Basic duplicate-delivery protection.
  if (paymentRecord.status === "success") {
    return {
      alreadyProcessed: true,
      reference,
    };
  }

  // Confirm the transaction directly with Paystack.
  const verification = await verifyPaystackPayment(reference);
  const transaction = verification?.data;

  if (
    verification?.status !== true ||
    transaction?.status !== "success" ||
    String(transaction?.reference) !== reference ||
    String(transaction?.currency).toUpperCase() !== "NGN"
  ) {
    throw new ApiError(
      409,
      "Paystack transaction verification failed"
    );
  }

  const verifiedAmount = Number(transaction.amount) / 100;

  if (
    !Number.isFinite(verifiedAmount) ||
    verifiedAmount <= 0 ||
    Math.abs(
      verifiedAmount - Number(paymentRecord.amount)
    ) > 0.01
  ) {
    throw new ApiError(
      409,
      "Verified payment amount does not match the recorded payment"
    );
  }

  const school = await School.findById(paymentRecord.schoolId);

  if (!school) {
    throw new ApiError(
      404,
      "School linked to payment was not found"
    );
  }

  if (!paymentRecord.subscriptionId) {
    throw new ApiError(
      400,
      "Payment is missing its subscription reference"
    );
  }

  const subscription = await Subscription.findOne({
    _id: paymentRecord.subscriptionId,
    schoolId: school._id,
  });

  if (!subscription) {
    throw new ApiError(
      404,
      "Subscription linked to payment was not found"
    );
  }

  // Use the intended plan and cycle saved when checkout
  // was initialized, rather than mutable subscription fields.
  const intendedPlan = paymentRecord.metadata?.plan;
  const intendedCycle = paymentRecord.metadata?.billingCycle;
  const action =
    paymentRecord.metadata?.action || "new_subscription";

  const allowedPlans = [
    "starter",
    "growth",
    "premium",
  ];

  const allowedCycles = [
    "monthly",
    "quarterly",
    "yearly",
  ];

  const allowedActions = [
    "new_subscription",
    "upgrade",
    "renewal",
  ];

  if (!allowedPlans.includes(intendedPlan)) {
    throw new ApiError(
      400,
      "Invalid plan stored in payment record"
    );
  }

  if (!allowedCycles.includes(intendedCycle)) {
    throw new ApiError(
      400,
      "Invalid billing cycle stored in payment record"
    );
  }

  if (!allowedActions.includes(action)) {
    throw new ApiError(
      400,
      "Invalid subscription payment action"
    );
  }

  // Validate the action against the school's current state.
 
let previousSubscription = null;

if (action === "upgrade") {
  previousSubscription = await Subscription.findOne({
    schoolId: school._id,
    _id: { $ne: subscription._id },
    status: "active",
    expiresAt: { $gt: new Date() },
  }).sort({ expiresAt: -1, createdAt: -1 });

  if (!previousSubscription) {
    throw new ApiError(
      409,
      "No active subscription was found to upgrade"
    );
  }

  if (intendedPlan === previousSubscription.plan) {
    throw new ApiError(
      409,
      "Choose a different plan to upgrade"
    );
  }
}


  if (
    action === "renewal" &&
    intendedPlan !== subscription.plan
  ) {
    throw new ApiError(
      409,
      "Renewal plan does not match the current subscription plan"
    );
  }

  const now = new Date();

  const currentExpiry = subscription.expiresAt
    ? new Date(subscription.expiresAt)
    : null;

  // Renewals extend from the current expiry if still valid.
  // New subscriptions and upgrades start the new term now.
  const startsAt =
    action === "renewal" &&
    currentExpiry &&
    currentExpiry > now
      ? currentExpiry
      : now;

  const expiresAt = calculateSubscriptionExpiry(
    startsAt,
    intendedCycle
  );

  // Record the verified payment.
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

  // Apply the paid plan and billing period.
  subscription.plan = intendedPlan;
  subscription.billingCycle = intendedCycle;
  subscription.status = "active";
  subscription.isTrial = false;
  subscription.startsAt = startsAt;
  subscription.expiresAt = expiresAt;
  subscription.trialEndsAt = null;
  subscription.amount = verifiedAmount;
  subscription.failedPaymentAttempts = 0;

  // Keep school billing fields synchronized.
  school.plan = intendedPlan;
  school.billingCycle = intendedCycle;
  school.subscriptionStatus = "active";
  school.billingStatus = "active";
  school.subscriptionStartedAt = startsAt;
  school.subscriptionExpiresAt = expiresAt;
  school.trialStartAt = null;
  school.trialEndsAt = null;
  school.onboardingStatus = "active";
  school.isActive = true;

  // NOTE: These writes are not atomic. For production,
  // use a MongoDB transaction or an atomic idempotency
  // strategy to prevent concurrent webhook double-processing.
 
await paymentRecord.save();
await subscription.save();

if (action === "upgrade" && previousSubscription) {
  previousSubscription.status = "expired";
  await previousSubscription.save();
}

await school.save();
  // Email the receipt only after the payment and subscription
// updates have been saved successfully.
await sendVerifiedSubscriptionReceipt(paymentRecord, school);

  return {
    processed: true,
    action,
    reference,
    schoolId: String(school._id),
    plan: subscription.plan,
    billingCycle: subscription.billingCycle,
    subscriptionStatus: subscription.status,
    expiresAt,
  };
}
