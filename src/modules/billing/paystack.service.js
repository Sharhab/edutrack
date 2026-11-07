
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apiError.js";
import { School } from "../schools/school.model.js";
import { Subscription } from "./subscription.model.js";
import { SubPayment } from "./sub-payment.model.js";
import { sendSubscriptionPaymentReceiptEmail } from "../../services/email.service.js";
import mongoose from "mongoose";

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
      reference:
        paymentRecord.gatewayResponse?.reference ||
        paymentRecord.reference,
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
 * - New subscriptions
 * - Upgrades
 * - Renewals
 *
 * Important:
 * - Always verifies the transaction with Paystack.
 * - Does not assume payment success means activation succeeded.
 * - Recovers interrupted payment reconciliation.
 * - Prevents a successfully reconciled payment from
 *   extending the subscription more than once.
 * - Sends receipts after successful reconciliation.
 *
 * The controller must verify the Paystack webhook
 * signature before calling this function.
 * =========================================
 */
export async function handlePaystackWebhook(event) {
  if (event?.event !== "charge.success") {
    return { ignored: true };
  }

  const reference = String(event?.data?.reference || "").trim();

  if (!reference) {
    throw new ApiError(400, "Missing Paystack payment reference");
  }

  const eventMetadata = event?.data?.metadata || {};
  const paymentId = String(eventMetadata.paymentId || "").trim();

  // Find the payment by its exact EduTrack reference first.
  let initialPayment = await SubPayment.findOne({ reference });

  // Retain the existing payment-ID recovery path, but all transaction
  // details and metadata are still verified before any database changes.
  if (
    !initialPayment &&
    paymentId &&
    mongoose.isValidObjectId(paymentId)
  ) {
    initialPayment = await SubPayment.findOne({
      _id: paymentId,
      "metadata.purpose": "edutrack_subscription",
    });
  }

  if (!initialPayment) {
    throw new ApiError(
      404,
      "No matching subscription payment was found for this Paystack transaction"
    );
  }

  if (initialPayment.metadata?.purpose !== "edutrack_subscription") {
    throw new ApiError(
      400,
      "Payment reference is not an EduTrack subscription payment"
    );
  }

  // Validate Paystack's signed event metadata against the saved payment.
  const metadataMatches =
    String(initialPayment.schoolId) === String(eventMetadata.schoolId) &&
    String(initialPayment.subscriptionId) ===
      String(eventMetadata.subscriptionId) &&
    String(initialPayment._id) === String(eventMetadata.paymentId) &&
    String(initialPayment.metadata?.plan) ===
      String(eventMetadata.plan) &&
    String(initialPayment.metadata?.billingCycle) ===
      String(eventMetadata.billingCycle) &&
    String(initialPayment.metadata?.upgradeFromSubscriptionId || "") ===
      String(eventMetadata.upgradeFromSubscriptionId || "");

  if (!metadataMatches) {
    throw new ApiError(
      409,
      "Paystack metadata does not match the saved EduTrack payment"
    );
  }

  // Verify directly with Paystack before changing any records.
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
  const recordedAmount = Number(initialPayment.amount);

  if (
    !Number.isFinite(verifiedAmount) ||
    verifiedAmount <= 0 ||
    !Number.isFinite(recordedAmount) ||
    recordedAmount <= 0 ||
    Math.abs(verifiedAmount - recordedAmount) > 0.01
  ) {
    throw new ApiError(
      409,
      "Verified payment amount does not match the recorded payment"
    );
  }

  const intendedPlan = initialPayment.metadata?.plan;
  const intendedCycle = initialPayment.metadata?.billingCycle;
  const action = initialPayment.metadata?.action || "new_subscription";

  const allowedPlans = ["starter", "growth", "premium"];
  const allowedCycles = ["monthly", "quarterly", "yearly"];
  const allowedActions = ["new_subscription", "upgrade", "renewal"];
  const planRank = { starter: 1, growth: 2, premium: 3 };

  if (!allowedPlans.includes(intendedPlan)) {
    throw new ApiError(400, "Invalid plan stored in payment record");
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

  const paidAt = transaction.paid_at
    ? new Date(transaction.paid_at)
    : new Date();

  if (Number.isNaN(paidAt.getTime())) {
    throw new ApiError(409, "Invalid payment date returned by Paystack");
  }

  const session = await mongoose.startSession();

  let result;
  let receiptPaymentId = null;
  let receiptSchoolId = null;

  try {
    await session.withTransaction(async () => {
      // Reload the payment inside the transaction.
      let paymentRecord = await SubPayment.findOne({ reference }).session(
        session
      );

      // Recover by saved payment ID if the reference lookup did not find it.
      if (
        !paymentRecord &&
        paymentId &&
        mongoose.isValidObjectId(paymentId)
      ) {
        paymentRecord = await SubPayment.findOne({
          _id: paymentId,
          schoolId: initialPayment.schoolId,
          subscriptionId: initialPayment.subscriptionId,
          "metadata.purpose": "edutrack_subscription",
        }).session(session);
      }

      if (!paymentRecord) {
        throw new ApiError(
          404,
          "Payment record could not be recovered inside the transaction"
        );
      }

      if (
        paymentRecord.metadata?.purpose !== "edutrack_subscription" ||
        String(paymentRecord._id) !== String(initialPayment._id) ||
        String(paymentRecord.schoolId) !== String(initialPayment.schoolId) ||
        String(paymentRecord.subscriptionId) !==
          String(initialPayment.subscriptionId)
      ) {
        throw new ApiError(409, "Payment record changed during reconciliation");
      }

      // A completed and reconciled payment must never be applied twice.
      if (
        paymentRecord.status === "success" &&
        paymentRecord.reconciled === true
      ) {
        result = {
          alreadyProcessed: true,
          reference,
          schoolId: String(paymentRecord.schoolId),
        };

        receiptPaymentId = paymentRecord._id;
        receiptSchoolId = paymentRecord.schoolId;
        return;
      }

      const school = await School.findById(paymentRecord.schoolId).session(
        session
      );

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
      }).session(session);

      if (!subscription) {
        throw new ApiError(
          404,
          "Subscription linked to payment was not found"
        );
      }

      // Recover a payment marked successful before reconciliation completed.
      // Do not calculate another billing period from an uncertain state.
      if (paymentRecord.status === "success") {
        const schoolAlreadyMatches =
          subscription.status === "active" &&
          subscription.plan === intendedPlan &&
          subscription.billingCycle === intendedCycle &&
          school.plan === subscription.plan &&
          school.billingCycle === subscription.billingCycle &&
          school.subscriptionStatus === "active" &&
          school.billingStatus === "active" &&
          school.isActive === true &&
          school.subscriptionExpiresAt &&
          subscription.expiresAt &&
          new Date(school.subscriptionExpiresAt).getTime() ===
            new Date(subscription.expiresAt).getTime();

        if (!schoolAlreadyMatches) {
          throw new ApiError(
            409,
            "Payment was previously marked successful but activation is incomplete. Manual reconciliation is required to avoid applying a renewal twice."
          );
        }

        // For an upgrade, also ensure the exact original subscription
        // is no longer active before marking this payment reconciled.
        if (action === "upgrade") {
          const previousId =
            paymentRecord.metadata?.upgradeFromSubscriptionId;

          if (!previousId || !mongoose.isValidObjectId(previousId)) {
            throw new ApiError(
              409,
              "Upgrade payment is missing its original subscription reference."
            );
          }

          const previousStillActive = await Subscription.exists({
            _id: previousId,
            schoolId: school._id,
            status: "active",
          }).session(session);

          if (previousStillActive) {
            throw new ApiError(
              409,
              "The previous subscription is still active. Manual reconciliation is required."
            );
          }
        }

        paymentRecord.reconciled = true;
        paymentRecord.reconciledAt = new Date();
        await paymentRecord.save({ session });

        result = {
          processed: true,
          recovered: true,
          reference,
          schoolId: String(school._id),
          plan: subscription.plan,
          billingCycle: subscription.billingCycle,
          subscriptionStatus: subscription.status,
          expiresAt: subscription.expiresAt,
        };

        receiptPaymentId = paymentRecord._id;
        receiptSchoolId = school._id;
        return;
      }

      // Only pending or processing payments may be newly applied.
      if (!["pending", "processing"].includes(paymentRecord.status)) {
        throw new ApiError(
          409,
          `Payment cannot be processed from status: ${paymentRecord.status}`
        );
      }

      const now = new Date();
      let previousSubscription = null;

      // Resolve and validate the exact subscription captured at checkout.
      // Do this BEFORE activating the new subscription.
      if (action === "upgrade") {
        const previousId =
          paymentRecord.metadata?.upgradeFromSubscriptionId;

        if (!previousId || !mongoose.isValidObjectId(previousId)) {
          throw new ApiError(
            409,
            "Upgrade payment is missing its original subscription reference."
          );
        }

        previousSubscription = await Subscription.findOne({
          _id: previousId,
          schoolId: school._id,
          status: "active",
          isTrial: { $ne: true },
          expiresAt: { $gt: now },
        }).session(session);

        if (!previousSubscription) {
          throw new ApiError(
            409,
            "The original subscription is no longer active. Upgrade reconciliation was stopped."
          );
        }

        if (
          !planRank[previousSubscription.plan] ||
          planRank[intendedPlan] <= planRank[previousSubscription.plan]
        ) {
          throw new ApiError(
            409,
            "The selected plan is not a higher tier than the current plan."
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

      // Renewal extends an unexpired subscription; new subscriptions
      // and upgrades begin at the verified payment time.
      const currentExpiry = subscription.expiresAt
  ? new Date(subscription.expiresAt)
  : null;

const isExistingPaidRenewal =
  action === "renewal" &&
  subscription.status === "active" &&
  subscription.isTrial !== true;

const startsAt =
  isExistingPaidRenewal &&
  currentExpiry &&
  currentExpiry > now
    ? currentExpiry
    : paidAt;

      const expiresAt = calculateSubscriptionExpiry(
        startsAt,
        intendedCycle
      );

      // Save verified payment data in the same transaction.
      paymentRecord.status = "success";
      paymentRecord.paidAt = paidAt;
      paymentRecord.reconciled = false;
      paymentRecord.reconciledAt = null;
      paymentRecord.gatewayResponse = {
        status: transaction.status,
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        paid_at: transaction.paid_at,
      };

      await paymentRecord.save({ session });

      // Activate the new subscription.
      subscription.plan = intendedPlan;
      subscription.billingCycle = intendedCycle;
      subscription.status = "active";
      subscription.isTrial = false;
      subscription.startsAt = startsAt;
      subscription.expiresAt = expiresAt;
      subscription.trialEndsAt = null;
      subscription.amount = verifiedAmount;
      subscription.failedPaymentAttempts = 0;

      await subscription.save({ session });

      // Expire only the exact previous subscription captured at checkout.
      if (action === "upgrade") {
        previousSubscription.status = "expired";
        await previousSubscription.save({ session });
      }

      // Activate the school only after the subscription updates are ready.
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

      await school.save({ session });

      // Commit this marker atomically with payment and subscription updates.
      paymentRecord.reconciled = true;
      paymentRecord.reconciledAt = new Date();
      await paymentRecord.save({ session });

      result = {
        processed: true,
        action,
        reference,
        schoolId: String(school._id),
        plan: subscription.plan,
        billingCycle: subscription.billingCycle,
        subscriptionStatus: subscription.status,
        expiresAt,
      };

      receiptPaymentId = paymentRecord._id;
      receiptSchoolId = school._id;
    });
  } finally {
    await session.endSession();
  }

  // Send the receipt only after the database transaction commits.
  // Email failure must never reverse a verified payment.
  if (receiptPaymentId && receiptSchoolId) {
    const paymentForReceipt = await SubPayment.findById(receiptPaymentId);
    const schoolForReceipt = await School.findById(receiptSchoolId);

    if (paymentForReceipt && schoolForReceipt) {
      await sendVerifiedSubscriptionReceipt(
        paymentForReceipt,
        schoolForReceipt
      );
    }
  }

  return result;
}
