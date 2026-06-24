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


export async function syncSchoolFromSubscription(schoolId) {
  const subscription = await Subscription.findOne({ schoolId }).sort({ createdAt: -1 });

  if (!subscription) return;

  const school = await School.findById(schoolId);
  if (!school) return;

  school.plan = subscription.plan;
  school.billingCycle = subscription.billingCycle;
  school.subscriptionStatus = subscription.status;
  school.subscriptionStartedAt = subscription.startsAt;
  school.subscriptionExpiresAt = subscription.expiresAt;

  school.isActive = subscription.status === "active";
  school.isTrial = false; // 🔥 MISSING FIX

  await school.save();
}
/**
 * =========================================
 * INITIALIZE RENEWAL PAYMENT
 * =========================================
 */
export async function initializeRenewalPayment(user, payload) {
  const school = await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  const plan = payload.plan || school.plan;
  const billingCycle = payload.billingCycle || school.billingCycle;

  // ✅ INLINE PRICING (no constants needed yet)
  const pricing = {
    starter: {
      monthly: 10000,
      quarterly: 25000,
      yearly: 70000,
    },
    growth: {
      monthly: 20000,
       quarterly: 55000,
      yearly: 140000,
    },
    premium: {
      monthly: 30000,
      quarterly: 850000,
      yearly: 220000,
    },
  };

  const amount = pricing?.[plan]?.[billingCycle];

  if (!amount) {
    throw new ApiError(
      400,
      `Invalid pricing for plan: ${plan} (${billingCycle})`
    );
  }

  // 1. Ensure no active subscription
  await ensureNoActiveSubscription(school._id);

  // 2. Create or update pending subscription
  let subscription = await Subscription.findOne({
    schoolId: school._id,
    status: "pending",
  });

  if (!subscription) {
    subscription = await Subscription.create({
      schoolId: school._id,
      plan,
      billingCycle,
      amount,
      status: "pending",
      startsAt: null,
      expiresAt: null,
    });
  } else {
    subscription.plan = plan;
    subscription.billingCycle = billingCycle;
    subscription.amount = amount;
    await subscription.save();
  }

  // 3. Initialize Paystack payment
  const payment = await initializePaystackPayment({
    schoolId: school._id,
    email: school.email,
    amount, // ✅ FIXED: required field now included
    plan,
    billingCycle,
    callbackUrl: payload.callbackUrl,
    metadata: {
      subscriptionId: subscription._id,
      type: "renewal",
    },
  });

  return {
    authorizationUrl: payment.authorizationUrl,
    reference: payment.reference,
    subscriptionId: subscription._id,
    amount,
  };
}

export async function paystackWebhookHandler(req, res) {
  const event = req.body;

  if (event.event !== "charge.success") {
    return res.sendStatus(200);
  }

  const metadata = event.data.metadata;

  if (!metadata?.subscriptionId || !metadata?.schoolId) {
    return res.sendStatus(200);
  }

  const subscription = await Subscription.findById(metadata.subscriptionId);
  if (!subscription) return res.sendStatus(200);

  const now = new Date();

  const duration =
    subscription.billingCycle === "monthly"
      ? 30
      : subscription.billingCycle === "quarterly"
      ? 90
      : 365;

  subscription.status = "active";
  subscription.startsAt = now;
  subscription.expiresAt = new Date(
    now.getTime() + duration * 24 * 60 * 60 * 1000
  );

  await subscription.save();

  // sync school
  await syncSchoolFromSubscription(metadata.schoolId);

  return res.sendStatus(200);
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
export async function updateSubscription(
  id,
  payload
) {
  const doc =
    await Subscription.findById(id);

  if (!doc) {
    throw new ApiError(
      404,
      "Subscription not found"
    );
  }

  if (payload.plan !== undefined)
    doc.plan = payload.plan;

  if (payload.amount !== undefined)
    doc.amount = payload.amount;

  if (
    payload.billingCycle !==
    undefined
  )
    doc.billingCycle =
      payload.billingCycle;

  if (payload.status !== undefined)
    doc.status = payload.status;

  if (
    payload.startsAt !== undefined
  )
    doc.startsAt =
      payload.startsAt || null;

  if (
    payload.expiresAt !== undefined
  )
    doc.expiresAt =
      payload.expiresAt || null;

  if (payload.notes !== undefined)
    doc.notes = payload.notes;

  await doc.save();

  const school =
    await School.findById(
      doc.schoolId
    );

  if (school) {
    school.plan = doc.plan;

    school.billingCycle =
      doc.billingCycle;

    school.subscriptionStatus =
      doc.status;

    school.subscriptionStartedAt =
      doc.startsAt || null;

    school.subscriptionExpiresAt =
      doc.expiresAt || null;

    school.isActive =
      doc.status === "active";

    school.isTrial = false;

    /**
     * ONBOARDING STATUS SYNC
     */
    if (
      doc.status === "active"
    ) {
      school.onboardingStatus =
        "active";
    }

    if (
      doc.status === "expired"
    ) {
      school.onboardingStatus =
        "suspended";
    }

    if (
      doc.status === "cancelled"
    ) {
      school.onboardingStatus =
        "suspended";
    }

    await school.save();
  }

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

  const plan = payload.plan || school.plan || "starter";
  const billingCycle = payload.billingCycle || school.billingCycle || "monthly";

  // 1. create pending subscription FIRST
  let subscription = await Subscription.create({
    schoolId: school._id,
    plan,
    billingCycle,
    amount: 0,
    status: "pending",
    startsAt: null,
    expiresAt: null,
  });

  // 2. initialize Paystack WITH metadata (VERY IMPORTANT)
  const payment = await initializePaystackPayment({
    schoolId: school._id,
    email: school.email,
    plan,
    billingCycle,
    amount: payload.amount, // MUST exist or calculate
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

