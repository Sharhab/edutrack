import { Subscription } from "./subscription.model.js";
import { SubPayment } from "./sub-payment.model.js";
import { SuperInvoice } from "./super-invoice.model.js";
import { School } from "../schools/school.model.js";
import { ApiError } from "../../utils/apiError.js";
import {
  initializePaystackPayment,
} from "./paystack.service.js";
function generateInvoiceNumber() {
  return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function ensureSchool(schoolId) {
  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  return school;
}

export async function syncSchoolFromSubscription(
  schoolId
) {
  const subscription =
    await Subscription.findOne({
      schoolId,
      status: "active",
    }).sort({
      expiresAt: -1,
      createdAt: -1,
    });

  if (!subscription) {
    return null;
  }

  const school =
    await School.findById(schoolId);

  if (!school) {
    return null;
  }

  school.plan =
    subscription.plan;

  school.billingCycle =
    subscription.billingCycle;

  school.subscriptionStatus =
    subscription.status;

  school.subscriptionStartedAt =
    subscription.startsAt;

  school.subscriptionExpiresAt =
    subscription.expiresAt;

  school.isActive =
    subscription.status === "active";

  school.isTrial = false;

  school.billingStatus =
    subscription.status;

  if (
    subscription.status === "active"
  ) {
    school.onboardingStatus =
      "active";
  }

  if (
    subscription.status === "expired" ||
    subscription.status === "cancelled"
  ) {
    school.onboardingStatus =
      "suspended";
  }

  await school.save();

  return school;
}

export async function ensureNoActiveSubscription(
  schoolId
) {
  const active =
    await Subscription.findOne({
      schoolId,
      status: "active",
    });

  if (
    active &&
    active.expiresAt &&
    new Date(active.expiresAt) >
      new Date()
  ) {
    throw new ApiError(
      400,
      "School already has an active subscription"
    );
  }
}

/**
 * =========================================
 * INITIALIZE RENEWAL PAYMENT
 * =========================================
 */

const SUBSCRIPTION_PRICING = {
  starter: {
    monthly: 10000,
    quarterly: 27000,
    yearly: 96000,
  },
  growth: {
    monthly: 25000,
    quarterly: 67500,
    yearly: 240000,
  },
  premium: {
    monthly: 50000,
    quarterly: 135000,
    yearly: 480000,
  },
};

async function initializeSubscriptionCheckout(user, payload, action) {
  const school = await School.findById(user?.schoolId);

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  // Prefer a real current subscription over an older pending one.
  let subscription = await Subscription.findOne({
    schoolId: school._id,
    status: { $in: ["active", "trial"] },
  }).sort({ expiresAt: -1, createdAt: -1 });

  if (!subscription) {
    subscription = await Subscription.findOne({
      schoolId: school._id,
      status: "pending",
    }).sort({ createdAt: -1 });
  }

  const plan = String(
    payload.plan || subscription?.plan || school.plan || ""
  ).toLowerCase();

  const billingCycle = String(
    payload.billingCycle ||
      subscription?.billingCycle ||
      school.billingCycle ||
      "monthly"
  ).toLowerCase();

  const amount = SUBSCRIPTION_PRICING[plan]?.[billingCycle];

  if (!amount) {
    throw new ApiError(
      400,
      `Invalid pricing for plan: ${plan} (${billingCycle})`
    );
  }

  if (action === "upgrade") {
    if (!subscription) {
      throw new ApiError(
        400,
        "No existing subscription found. Use the subscription checkout instead."
      );
    }

    if (subscription.plan === plan) {
      throw new ApiError(
        400,
        "Choose a different plan to upgrade."
      );
    }
  }

  if (action === "renewal" && subscription) {
    if (subscription.plan !== plan) {
      throw new ApiError(
        400,
        "Renewal must use the current plan. Use upgrade to change plans."
      );
    }
  }

  // Never deactivate an existing paid subscription before payment.
  // For upgrades, create a separate pending subscription.
  if (action === "upgrade" || !subscription) {
    subscription = await Subscription.create({
      schoolId: school._id,
      plan,
      billingCycle,
      amount,
      status: "pending",
      isTrial: false,
      startsAt: null,
      expiresAt: null,
    });
  } else if (subscription.status === "pending") {
    subscription.plan = plan;
    subscription.billingCycle = billingCycle;
    subscription.amount = amount;
    await subscription.save();
  }

  const reference = `EDUTRACK-${randomUUID()}`;

  const paymentRecord = await SubPayment.create({
    schoolId: school._id,
    subscriptionId: subscription._id,
    amount,
    currency: "NGN",
    method: "paystack",
    reference,
    status: "pending",
    initiatedAt: new Date(),
    metadata: {
      purpose: "edutrack_subscription",
      action,
      plan,
      billingCycle,
    },
  });

  try {
    const payment = await initializePaystackPayment({
      schoolId: school._id,
      email: school.email,
      amount,
      plan,
      billingCycle,
      reference,
      callbackUrl: payload.callbackUrl,
      metadata: {
        purpose: "edutrack_subscription",
        action,
        schoolId: String(school._id),
        subscriptionId: String(subscription._id),
        paymentId: String(paymentRecord._id),
        plan,
        billingCycle,
      },
    });

    paymentRecord.gatewayResponse = {
      authorizationUrl: payment.authorizationUrl,
      reference: payment.reference,
      accessCode: payment.accessCode,
    };

    await paymentRecord.save();

    return {
      authorizationUrl: payment.authorizationUrl,
      reference: payment.reference,
      subscriptionId: subscription._id,
      amount,
      plan,
      billingCycle,
      action,
    };
  } catch (error) {
    // An uncertain gateway/network failure may occur after Paystack
    // has received the request. Keep the record for reconciliation.
    const statusCode = Number(error?.statusCode || error?.status || 0);

    paymentRecord.status =
      statusCode >= 400 && statusCode < 500
        ? "failed"
        : "processing";

    if (paymentRecord.status === "failed") {
      paymentRecord.failedAt = new Date();
    }

    paymentRecord.gatewayResponse = {
      message: String(error?.message || "Paystack initialization failed"),
      statusCode: statusCode || null,
    };

    await paymentRecord.save();
    throw error;
  }
}

export async function initializeRenewalPayment(user, payload) {
  return initializeSubscriptionCheckout(user, payload, "renewal");
}

export async function upgradeSubscription(user, payload) {
  return initializeSubscriptionCheckout(user, payload, "upgrade");
}

export async function paystackWebhookHandler(req, res) {
  try {
    const event = req.body;

    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const metadata = event.data?.metadata;

    if (
      !metadata?.subscriptionId ||
      !metadata?.schoolId
    ) {
      return res.sendStatus(200);
    }

    const subscription =
      await Subscription.findById(
        metadata.subscriptionId
      );

    if (!subscription) {
      return res.sendStatus(200);
    }

    // already processed
    if (
      subscription.status === "active" &&
      subscription.expiresAt &&
      subscription.expiresAt > new Date()
    ) {
      return res.sendStatus(200);
    }

    const now = new Date();

    const duration =
      subscription.billingCycle === "monthly"
        ? 30
        : subscription.billingCycle === "quarterly"
        ? 90
        : 365;

    subscription.status = "active";
    subscription.isTrial = false;
    subscription.amount =
      event.data.amount / 100;

    subscription.startsAt = now;

    subscription.expiresAt = new Date(
      now.getTime() +
        duration * 24 * 60 * 60 * 1000
    );

    await subscription.save();

    // expire all other subscriptions
    await Subscription.updateMany(
      {
        schoolId: metadata.schoolId,
        _id: { $ne: subscription._id },
        status: "active",
      },
      {
        $set: {
          status: "expired",
        },
      }
    );

    await syncSchoolFromSubscription(
      metadata.schoolId
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error(
      "PAYSTACK WEBHOOK ERROR:",
      error
    );

    return res.sendStatus(500);
  }
}

export async function listInvoices() {
  return SuperInvoice.find()
    .populate(
      "schoolId",
      "name slug email"
    )
    .populate(
      "subscriptionId",
      "plan status billingCycle"
    )
    .sort({ createdAt: -1 });
}

export async function listPayments() {
  return SubPayment.find()
    .populate(
      "schoolId",
      "name slug email"
    )
    .populate(
      "subscriptionId",
      "plan status billingCycle"
    )
    .sort({
      createdAt: -1,
    });
}

export async function getSubscriptionById(id) {
  const doc = await Subscription.findById(id).populate(
    "schoolId",
    "name slug email isActive subscriptionPlan subscriptionStatus"
  );
  if (!doc) {
    throw new ApiError(404, "Subscription not found");
  }
  return doc;
}

export async function createSubscription(
  payload
) {
  const school = await ensureSchool(
    payload.schoolId
  );

  const doc = await Subscription.create({
    schoolId: payload.schoolId,
    plan: payload.plan,
    amount: payload.amount,
    billingCycle:
    payload.billingCycle,
    status: payload.status,
    startsAt:
    payload.startsAt || null,
    expiresAt:
    payload.expiresAt || null,
    notes: payload.notes || "",
  });

  /**
   * SYNC SCHOOL
   */
  school.plan = payload.plan;
  school.billingCycle =
    payload.billingCycle;
school.subscriptionStatus =
    payload.status;
  school.subscriptionStartedAt =
    payload.startsAt || null;
  school.subscriptionExpiresAt =
    payload.expiresAt || null;
  school.isActive =
    payload.status === "active";
  school.isTrial = false;
  if (
    payload.status === "active"
  ) {
    school.onboardingStatus =
      "active";
  }

  await school.save();

  return getSubscriptionById(
    doc._id
  );
}

export async function deleteSubscription(id) {
  const doc = await Subscription.findByIdAndDelete(id);

  if (!doc) {
    throw new ApiError(404, "Subscription not found");
  }

  return { deleted: true };
}



export async function getPaymentById(id) {
  const doc = await SubPayment.findById(id)
    .populate("schoolId", "name slug email")
    .populate("subscriptionId", "plan status billingCycle");

  if (!doc) {
    throw new ApiError(404, "Payment not found");
  }

  return doc;
}

export async function createManualPayment(payload) {
  const school = await ensureSchool(payload.schoolId);

  const doc = await SubPayment.create({
    schoolId: payload.schoolId,
    subscriptionId: payload.subscriptionId || null,
    amount: payload.amount,
    currency: payload.currency || "NGN",
    method: payload.method,
    reference: payload.reference || "",
    status: payload.status,
    paidAt:
      payload.status === "success"
        ? new Date()
        : null,
  });

  /**
   * SUCCESS PAYMENT
   * Reactivate school if needed
   */
  if (payload.status === "success") {
    school.isActive = true;

    if (
      school.subscriptionStatus ===
        "inactive" ||
      school.subscriptionStatus ===
        "expired" ||
      school.subscriptionStatus ===
        "pending"
    ) {
      school.subscriptionStatus =
        "active";
    }

    await school.save();
  }

  return getPaymentById(doc._id);
}

export async function createInvoice(payload) {
  await ensureSchool(payload.schoolId);

  const doc = await SuperInvoice.create({
    schoolId: payload.schoolId,
    subscriptionId: payload.subscriptionId || null,
    invoiceNumber: generateInvoiceNumber(),
    amount: payload.amount,
    dueDate: payload.dueDate || null,
    description: payload.description || "",
  });

  return getInvoiceById(doc._id);
}

export async function upgradeSubscription(user, payload) {
  const school = await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  const plan = payload.plan || "starter";
  const billingCycle = payload.billingCycle || "monthly";

  // 1. compute amount (same pricing logic)
  const pricing = {
    starter: { monthly: 10000, quarterly: 25000, yearly: 70000 },
    growth: { monthly: 20000, quarterly: 55000, yearly: 140000 },
    premium: { monthly: 30000, quarterly: 850000, yearly: 220000 },
  };

  const amount = pricing?.[plan]?.[billingCycle];

  if (!amount) {
    throw new ApiError(400, "Invalid plan pricing");
  }

  // 2. deactivate old active subscriptions (IMPORTANT)
  await Subscription.updateMany(
    { schoolId: school._id, status: "active" },
    { status: "expired" }
  );

  // 3. create NEW subscription (pending)
  const subscription = await Subscription.create({
    schoolId: school._id,
    plan,
    billingCycle,
    amount,
    status: "pending",
    isTrial: false,
    startsAt: null,
    expiresAt: null,
  });

  // 4. initialize payment
  const payment = await initializePaystackPayment({
    schoolId: school._id,
    email: school.email,
    amount,
    plan,
    billingCycle,
    callbackUrl: payload.callbackUrl,
    metadata: {
      subscriptionId: subscription._id,
      schoolId: school._id,
      type: "upgrade",
    },
  });

  return {
    authorizationUrl: payment.authorizationUrl,
    reference: payment.reference,
    subscriptionId: subscription._id,
  };
}
/**
 * =========================================
 * SCHOOL BILLING HISTORY
 * =========================================
 */
export async function getBillingHistory(user) {
  const schoolId = user?.schoolId;

  if (!schoolId) {
    throw new ApiError(403, "School context missing");
  }

  const [payments, subscriptions, invoices] = await Promise.all([
    SubPayment.find({ schoolId }).sort({ createdAt: -1 }).lean(),
    Subscription.find({ schoolId }).sort({ createdAt: -1 }).lean(),
    SuperInvoice.find({ schoolId }).sort({ createdAt: -1 }).lean(),
  ]);

  /**
   * =========================
   * 🔥 TIMELINE MERGE (NEW UPGRADE)
   * =========================
   */
  const timeline = [
    ...payments.map((p) => ({
      type: "payment",
      data: p,
    })),
    ...subscriptions.map((s) => ({
      type: "subscription",
      data: s,
    })),
    ...invoices.map((i) => ({
      type: "invoice",
      data: i,
    })),
  ].sort(
    (a, b) =>
      new Date(b.data.createdAt) - new Date(a.data.createdAt)
  );

  return {
    timeline,
    summary: {
      totalPayments: payments.length,
      totalSubscriptions: subscriptions.length,
      totalInvoices: invoices.length,
    },
  };
}

/**
 * =========================================
 * CURRENT BILLING
 * =========================================
 */
export async function getCurrentBilling(schoolId) {
  const school = await School.findById(schoolId);

  if (!school) {
    throw new Error("School not found");
  }

  const daysLeft = school.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(school.trialEndsAt).getTime() -
            Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  return {
    plan: school.plan,
    billingCycle: school.billingCycle,

    subscriptionStatus:
      school.subscriptionStatus,

    onboardingStatus:
      school.onboardingStatus,

    isActive: school.isActive,

    trialStartAt: school.trialStartAt,
    trialEndsAt: school.trialEndsAt,

    daysLeft, // ✅ added

    subscriptionStartedAt:
      school.subscriptionStartedAt,

    subscriptionExpiresAt:
      school.subscriptionExpiresAt,
  };
}
export async function getInvoiceById(id) {
  const doc = await SuperInvoice.findById(id)
    .populate("schoolId", "name slug email")
    .populate("subscriptionId", "plan status billingCycle");

  if (!doc) {
    throw new ApiError(404, "Invoice not found");
  }

  return doc;
}

export async function listSubscriptions() {
  return Subscription.find()
    .populate(
      "schoolId",
      "name slug email plan subscriptionStatus"
    )
    .sort({ createdAt: -1 });
}

