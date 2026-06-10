import { initializePaystackSchema } from "./paystack.validation.js";

import {
  initializePaystackPayment,
  verifyPaystackPayment,
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
   upgradeSubscription,
  listSubscriptions,
  updateSubscription,
  getCurrentBilling,
  getBillingHistory,
   initializeRenewalPayment,
} from "./billing.service.js";
/**
 * =========================
 * PAYSTACK
 * =========================
 */

export async function initializeBillingPaymentHandler(req, res) {
  const data = await initializeRenewalPayment(
    req.user,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: "Payment initialized successfully",
    data,
  });
}
export async function initializePaystackHandler(req, res) {
  const parsed = initializePaystackSchema.parse(req.body);

  const data = await initializePaystackPayment(parsed);

  res.status(200).json({
    success: true,
    message: "Payment initialized successfully",
    data,
  });
}

export async function verifyPaystackHandler(req, res) {
  const data = await verifyPaystackPayment(req.params.reference);

  res.json({
    success: true,
    message: "Payment verified successfully",
    data,
  });
}




/**
 * =========================
 * SUBSCRIPTIONS
 * =========================
 */
export async function listSubscriptionsHandler(req, res) {
  const data = await listSubscriptions();

  res.json({
    success: true,
    message: "Subscriptions fetched successfully",
    data,
  });
}

export async function getSubscriptionHandler(req, res) {
  const data = await getSubscriptionById(req.params.id);

  res.json({
    success: true,
    message: "Subscription fetched successfully",
    data,
  });
}

export async function createSubscriptionHandler(req, res) {
  const parsed = createSubscriptionSchema.parse(req.body);

  const data = await createSubscription(parsed);

  res.status(201).json({
    success: true,
    message: "Subscription created successfully",
    data,
  });
}

export async function updateSubscriptionHandler(req, res) {
  const parsed = updateSubscriptionSchema.parse(req.body);

  const data = await updateSubscription(req.params.id, parsed);

  res.json({
    success: true,
    message: "Subscription updated successfully",
    data,
  });
}

export async function deleteSubscriptionHandler(req, res) {
  const data = await deleteSubscription(req.params.id);

  res.json({
    success: true,
    message: "Subscription deleted successfully",
    data,
  });
}

/**
 * =========================
 * PAYMENTS (🔥 FIXED MISSING EXPORT)
 * =========================
 */
export async function listPaymentsHandler(req, res) {
  const data = await listPayments();

  res.json({
    success: true,
    message: "Payments fetched successfully",
    data,
  });
}

/**
 * 🔥 THIS FIXES YOUR ERROR
 */
export async function createManualPaymentHandler(req, res) {
  const parsed = createManualPaymentSchema.parse(req.body);

  const data = await createManualPayment(parsed);

  res.status(201).json({
    success: true,
    message: "Payment created successfully",
    data,
  });
}

export async function getPaymentHandler(req, res) {
  const data = await getPaymentById(req.params.id);

  res.json({
    success: true,
    message: "Payment fetched successfully",
    data,
  });
}

/**
 * =========================
 * INVOICES
 * =========================
 */
export async function listInvoicesHandler(req, res) {
  const data = await listInvoices();

  res.json({
    success: true,
    message: "Invoices fetched successfully",
    data,
  });
}

export async function createInvoiceHandler(req, res) {
  const parsed = createInvoiceSchema.parse(req.body);

  const data = await createInvoice(parsed);

  res.status(201).json({
    success: true,
    message: "Invoice created successfully",
    data,
  });
}

export async function getInvoiceHandler(req, res) {
  const data = await getInvoiceById(req.params.id);

  res.json({
    success: true,
    message: "Invoice fetched successfully",
    data,
  });
}
/**
 * GET CURRENT BILLING
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
  } catch (err) {
    console.error("getCurrentBillingHandler error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch billing",
    });
  }
}

export async function upgradeSubscriptionHandler(
  req,
  res
) {
  const data =
    await upgradeSubscription(
      req.user,
      req.body
    );

  res.status(200).json({
    success: true,
    message:
      "Subscription upgrade initialized successfully",
    data,
  });
}
/**
 * =========================================
 * BILLING HISTORY
 * =========================================
 */

export async function getBillingHistoryHandler(req, res) {
  try {
    const user = req.user;

    if (!user?.schoolId) {
      return res.status(403).json({
        success: false,
        message: "School context missing",
      });
    }

    const data = await getBillingHistory(user);

    return res.json({
      success: true,
      message: "Billing history fetched successfully",
      data,
    });
  } catch (err) {
    console.error("getBillingHistoryHandler error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch billing history",
    });
  }
}