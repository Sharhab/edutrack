import { initializePaystackSchema } from "./paystack.validation.js";

import {
  initializePaystackPayment,
  handlePaystackWebhook,
} from "./paystack.service.js";


import {
  createInvoiceSchema,
  createManualPaymentSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
} from "./billing.validation.js";

import {
  createInvoice,
  createManualPayment,
  createSubscription,
  deleteSubscription,
  getInvoiceById,
  getPaymentById,
  getSubscriptionById,
  listInvoices,
  listPayments,
  listSubscriptions,
  updateSubscription,
  getCurrentBilling,
  getBillingHistory,
  upgradeSubscription,
  initializeRenewalPayment,
} from "./billing.service.js";

/**
 * PAYSTACK
 */

// Existing subscription renewal initialization.
export async function initializeBillingPaymentHandler(req, res) {
  const data = await initializeRenewalPayment(req.user, req.body);

  return res.status(200).json({
    success: true,
    message: "Payment initialized successfully",
    data,
  });
}

// Preserve the existing Paystack initialization handler.
export async function initializePaystackHandler(req, res) {
  const parsed = initializePaystackSchema.parse(req.body);
  const data = await initializePaystackPayment(parsed);

  return res.status(200).json({
    success: true,
    message: "Payment initialized successfully",
    data,
  });
}

// Preserve the existing verification handler.

export async function verifyPaystackHandler(req, res) {
  const reference = String(req.params.reference || "").trim();

  if (!reference) {
    return res.status(400).json({
      success: false,
      message: "Payment reference is required",
    });
  }

  // The service verifies the transaction directly with Paystack,
  // validates the recorded payment, and reconciles the subscription.
  const result = await handlePaystackWebhook({
    event: "charge.success",
    data: { reference },
  });

  return res.status(200).json({
    success: true,
    message: result.alreadyProcessed
      ? "Payment was already verified and processed"
      : "Payment verified and subscription reconciled successfully",
    data: result,
  });
}

/**
 * SUBSCRIPTIONS
 */

export async function listSubscriptionsHandler(req, res) {
  const [subscriptions, payments] = await Promise.all([
    listSubscriptions(),
    listPayments(),
  ]);

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "active"
  ).length;

  const expiredSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "expired"
  ).length;

  const pendingPayments = payments.filter(
    (payment) => payment.status === "pending"
  ).length;

  // Count only payments recorded as successful.
  // This avoids treating the value of an active subscription as cash received.
  const totalRevenue = payments
    .filter((payment) => payment.status === "success")
    .reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

  const summary = {
    totalRevenue,
    activeSubscriptions,
    expiredSubscriptions,
    pendingPayments,
  };

  return res.json({
    success: true,
    message: "Subscriptions fetched successfully",
    subscriptions,
    summary,
    data: subscriptions,
  });
}

export async function getSubscriptionHandler(req, res) {
  const subscription = await getSubscriptionById(req.params.id);

  return res.json({
    success: true,
    message: "Subscription fetched successfully",
    subscription,
    data: subscription,
  });
}

export async function createSubscriptionHandler(req, res) {
  const parsed = createSubscriptionSchema.parse(req.body);
  const subscription = await createSubscription(parsed);

  return res.status(201).json({
    success: true,
    message: "Subscription created successfully",
    subscription,
    data: subscription,
  });
}

export async function updateSubscriptionHandler(req, res) {
  const parsed = updateSubscriptionSchema.parse(req.body);
  const subscription = await updateSubscription(req.params.id, parsed);

  return res.json({
    success: true,
    message: "Subscription updated successfully",
    subscription,
    data: subscription,
  });
}

export async function deleteSubscriptionHandler(req, res) {
  const data = await deleteSubscription(req.params.id);

  return res.json({
    success: true,
    message: "Subscription deleted successfully",
    data,
  });
}

/**
 * SUBSCRIPTION PAYMENTS
 */

export async function listPaymentsHandler(req, res) {
  const payments = await listPayments();

  return res.json({
    success: true,
    message: "Payments fetched successfully",
    payments,
    data: payments,
  });
}

export async function createManualPaymentHandler(req, res) {
  const parsed = createManualPaymentSchema.parse(req.body);
  const payment = await createManualPayment(parsed);

  return res.status(201).json({
    success: true,
    message: "Payment created successfully",
    payment,
    data: payment,
  });
}

export async function getPaymentHandler(req, res) {
  const payment = await getPaymentById(req.params.id);

  return res.json({
    success: true,
    message: "Payment fetched successfully",
    payment,
    data: payment,
  });
}

/**
 * SUPER ADMIN INVOICES
 */

export async function listInvoicesHandler(req, res) {
  const invoices = await listInvoices();

  return res.json({
    success: true,
    message: "Invoices fetched successfully",
    invoices,
    data: invoices,
  });
}

export async function createInvoiceHandler(req, res) {
  const parsed = createInvoiceSchema.parse(req.body);
  const invoice = await createInvoice(parsed);

  return res.status(201).json({
    success: true,
    message: "Invoice created successfully",
    invoice,
    data: invoice,
  });
}

export async function getInvoiceHandler(req, res) {
  const invoice = await getInvoiceById(req.params.id);

  return res.json({
    success: true,
    message: "Invoice fetched successfully",
    invoice,
    data: invoice,
  });
}

/**
 * CURRENT SCHOOL BILLING
 */

export async function getCurrentBillingHandler(req, res) {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: "School context missing",
      });
    }

    const data = await getCurrentBilling(schoolId);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getCurrentBillingHandler error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch billing",
    });
  }
}

/**
 * SUBSCRIPTION UPGRADE
 */

export async function upgradeSubscriptionHandler(req, res) {
  const data = await upgradeSubscription(req.user, req.body);

  return res.status(200).json({
    success: true,
    message: "Subscription upgrade initialized successfully",
    data,
  });
}

/**
 * SCHOOL BILLING HISTORY
 */

export async function getBillingHistoryHandler(req, res) {
  try {
    if (!req.user?.schoolId) {
      return res.status(403).json({
        success: false,
        message: "School context missing",
      });
    }

    const data = await getBillingHistory(req.user);

    return res.json({
      success: true,
      message: "Billing history fetched successfully",
      data,
    });
  } catch (error) {
    console.error("getBillingHistoryHandler error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch billing history",
    });
  }
}
