import slugify from "slugify";
import bcrypt from "bcryptjs";
import axios from "axios";
import { randomUUID } from "node:crypto";
import { SubPayment } from "../billing/sub-payment.model.js";
import { Subscription } from "../billing/subscription.model.js";
import { School } from "../schools/school.model.js";
import { User } from "../users/user.model.js";
import { bootstrapSchoolData } from "./bootstrap.service.js";
import { ApiError } from "../../utils/apiError.js";
import { initializePaystackPayment } from "../billing/paystack.service.js";
import { generateUniqueSlug } from "../../utils/slug.js";
import { verifyPaystackPayment }
from "../billing/paystack.service.js";
import {
  sendSchoolWelcomeEmail,
} from "../../services/email.service.js";
/**
 * =========================
 * HELPERS
 * =========================
 */
function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

/**
 * =========================
 * LOG HELPER
 * =========================
 */
function log(step, data = null) {
  console.log(`\n🚀 [ONBOARDING] ${step}`);

  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * =========================
 * UNIQUE CHECK
 * =========================
 */

async function verifyExistingSchoolAdmin(school, payload) {
  const email = normalizeEmail(payload.adminEmail);

  const admin = await User.findOne({
    email,
    schoolId: school._id,
    role: "school_admin",
  });

  if (!admin || !payload.adminPassword) {
    throw new ApiError(
      401,
      "This registration already exists. Enter the correct school administrator credentials to continue."
    );
  }

  const passwordMatches = await bcrypt.compare(
    payload.adminPassword,
    admin.passwordHash
  );

  if (!passwordMatches) {
    throw new ApiError(
      401,
      "The administrator email or password is incorrect."
    );
  }

  return admin;
}

async function ensureUniqueSchool({ schoolName, adminEmail }) {
  const slug = slugify(schoolName || "", {
    lower: true,
    strict: true,
    trim: true,
  });

  const email = normalizeEmail(adminEmail);

  const existingSchool = await School.findOne({ slug });

  if (existingSchool) {
    throw new ApiError(400, "School already exists");
  }

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    return;
  }

  // Only clean up an orphaned school-admin account.
  // Do not remove super admins, teachers, students, parents,
  // or admins whose school still exists.
  if (
    existingUser.role === "school_admin" &&
    existingUser.schoolId
  ) {
    const linkedSchool = await School.exists({
      _id: existingUser.schoolId,
    });

    if (!linkedSchool) {
      await User.deleteOne({
        _id: existingUser._id,
        role: "school_admin",
        schoolId: existingUser.schoolId,
      });

      // Confirm the email is now free before onboarding continues.
      const remainingUser = await User.findOne({ email });

      if (!remainingUser) {
        return;
      }
    }
  }

  throw new ApiError(400, "Admin email already exists");
}

export async function syncSchoolBilling(schoolId, subscription) {
  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(
      404,
      "School not found during billing sync"
    );
  }

  const now = new Date();
  const isTrial =
    subscription.status === "trial" &&
    subscription.isTrial === true &&
    subscription.trialEndsAt &&
    new Date(subscription.trialEndsAt) > now;

  school.plan = subscription.plan;
  school.billingCycle = subscription.billingCycle;
  school.subscriptionStatus = subscription.status;

  school.subscriptionStartedAt =
    subscription.startsAt ?? null;
  school.subscriptionExpiresAt =
    subscription.expiresAt ?? null;

  school.trialStartAt = isTrial
    ? subscription.startsAt ?? now
    : null;

  school.trialEndsAt = isTrial
    ? subscription.trialEndsAt
    : null;

  if (subscription.status === "active") {
    school.billingStatus = "active";
    school.isActive = true;
    school.onboardingStatus = "active";
  } else if (isTrial) {
    school.billingStatus = "trial";
    school.isActive = true;
    school.onboardingStatus = "active";
  } else if (subscription.status === "pending") {
    school.billingStatus = "pending_payment";
    school.isActive = false;
  } else {
    school.billingStatus = "expired";
    school.isActive = false;
    school.onboardingStatus = "suspended";
  }

  await school.save();
  return school;
}


/**
 * =========================
 * CREATE SCHOOL + ADMIN
 * =========================
 */
async function moveSchoolToTrial(schoolId, reason) {
  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  const now = new Date();

  // Preserve an existing valid trial end date.
  const trialEndsAt =
    school.trialEndsAt &&
    new Date(school.trialEndsAt) > now
      ? school.trialEndsAt
      : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  school.trialStartAt = school.trialStartAt || now;
  school.trialEndsAt = trialEndsAt;
  school.subscriptionStatus = "trial";
  school.billingStatus = "trial";
  school.onboardingStatus = "active";
  school.isActive = true;

  await school.save();

  await Subscription.findOneAndUpdate(
    { schoolId: school._id },
    {
      $set: {
        status: "trial",
        isTrial: true,
        startsAt: school.trialStartAt,
        trialEndsAt,
      },
    },
    { new: true }
  );

  console.warn("ONBOARDING PAYMENT REQUIRES ATTENTION", {
    schoolId: String(school._id),
    reason,
    trialEndsAt,
  });

  return school;
}

export async function activateOnboardingTrial(payload) {
  const email = normalizeEmail(payload.adminEmail);

  if (!email || !payload.adminPassword) {
    throw new ApiError(
      400,
      "Administrator email and password are required."
    );
  }

  let school = await School.findOne({ email });

  // First-time user: create the school directly on the trial.
  if (!school) {
    const created = await completeOnboarding({
      ...payload,
      adminEmail: email,
      isTrial: true,
    });

    return {
      ...created,
      message: "Your school account is ready on the 7-day free trial.",
    };
  }

  // Returning user: prove ownership before changing billing status.
  await verifyExistingSchoolAdmin(school, {
    ...payload,
    adminEmail: email,
  });

  if (
    school.subscriptionStatus === "active" &&
    school.subscriptionExpiresAt &&
    new Date(school.subscriptionExpiresAt) > new Date()
  ) {
    throw new ApiError(
      409,
      "This school already has an active paid subscription. Please log in."
    );
  }

  const now = new Date();

  // Do not restart or extend a trial that is already running.
  const existingTrialIsValid =
    school.subscriptionStatus === "trial" &&
    school.trialEndsAt &&
    new Date(school.trialEndsAt) > now;

  const trialStartAt = existingTrialIsValid
    ? school.trialStartAt || now
    : now;

  const trialEndsAt = existingTrialIsValid
    ? school.trialEndsAt
    : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let subscription = await Subscription.findOne({
    schoolId: school._id,
  }).sort({ createdAt: -1 });

  if (!subscription) {
    subscription = new Subscription({
      schoolId: school._id,
      plan: school.plan || "starter",
      billingCycle: school.billingCycle || "monthly",
      amount: 0,
    });
  }

  subscription.status = "trial";
  subscription.isTrial = true;
  subscription.startsAt = trialStartAt;
  subscription.trialEndsAt = trialEndsAt;
  subscription.expiresAt = null;

  await subscription.save();

  school.subscriptionStatus = "trial";
  school.billingStatus = "trial";
  school.onboardingStatus = "active";
  school.isActive = true;
  school.trialStartAt = trialStartAt;
  school.trialEndsAt = trialEndsAt;
  school.subscriptionStartedAt = trialStartAt;
  school.subscriptionExpiresAt = null;

  await school.save();

  return {
    school: {
      _id: school._id,
      name: school.name,
      slug: school.slug,
      domain: school.domain,
      onboardingStatus: school.onboardingStatus,
      billingStatus: school.billingStatus,
    },
    message: "Your school account is ready on the 7-day free trial.",
    loginUrl: `https://${school.slug}.edutrack.cloud/login`,
  };
}

export async function completeOnboarding(payload) {
  try {
  log("START ONBOARDING", {
  schoolName: payload.schoolName,
  adminEmail: payload.adminEmail,
  plan: payload.plan,
  billingCycle: payload.billingCycle,
  isTrial: payload.isTrial,
});
    await ensureUniqueSchool(payload);

    const email = normalizeEmail(payload.adminEmail);

    const slug = await generateUniqueSlug(
      payload.schoolName
    );

    const domain = `${slug}.edutrack.cloud`;

    const selectedPlan = [
      "starter",
      "growth",
      "premium",
    ].includes(payload.plan)
      ? payload.plan
      : "starter";

    const isTrial =
      payload.isTrial === true ||
      payload.planType === "trial";

    const trialStartAt = isTrial
      ? new Date()
      : null;

    const trialEndsAt = isTrial
      ? new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000
        )
      : null;

    const school = await School.create({
      name: payload.schoolName,
      slug,
      domain,

      email,

      phone: payload.phone || "",
      address: payload.address || "",

      plan: selectedPlan,

      billingStatus: isTrial
        ? "trial"
        : "pending_payment",

      trialStartAt,
      trialEndsAt,

      subscriptionStartedAt: null,
      subscriptionExpiresAt: null,

      onboardingStatus: isTrial
        ? "active"
        : "pending",

      subscriptionStatus: isTrial
        ? "trial"
        : "pending",

      isActive: true,

      settings: {
        allowStudentLogin: true,
        allowParentLogin: true,
      },
    });

    const hashedPassword =
      await bcrypt.hash(
        payload.adminPassword,
        10
      );

    const adminUser =
      await User.create({
        schoolId: school._id,

        firstName:
          payload.adminFirstName,

        lastName:
          payload.adminLastName,

        email,

        passwordHash:
          hashedPassword,

        role: "school_admin",

        isActive: true,
      });

    const subscription =
      await Subscription.create({
        schoolId: school._id,

        plan: selectedPlan,

        amount: 0,

        billingCycle:
          payload.billingCycle ||
          "monthly",

        status: isTrial
          ? "trial"
          : "pending",

        isTrial,

        trialEndsAt,

        startsAt: isTrial
          ? new Date()
          : null,

        expiresAt: null,

        enabledModules: [],
      });

    await syncSchoolBilling(
      school._id,
      subscription
    );

    await bootstrapSchoolData(
      school._id
    );

    const tenantBaseUrl =
  `https://${school.slug}.edutrack.cloud`;

const loginUrl =
  `${tenantBaseUrl}/login`;

await sendSchoolWelcomeEmail({
  adminFirstName:
    adminUser.firstName,

  adminEmail:
    adminUser.email,

  schoolName:
    school.name,

  loginUrl,

  schoolId:
    school._id.toString(),
});


return {
  school: {
    _id: school._id,
    name: school.name,
    slug: school.slug,
    domain: school.domain,
    onboardingStatus:
      school.onboardingStatus,
    billingStatus:
      school.billingStatus,
  },

  adminUser: {
    _id: adminUser._id,
    email: adminUser.email,
    role: adminUser.role,
  },

  subscription: {
    _id: subscription._id,
    plan: subscription.plan,
    status: subscription.status,
    isTrial:
      subscription.isTrial,
    trialEndsAt:
      subscription.trialEndsAt,
  },

  tenantBaseUrl,

  landingPage: tenantBaseUrl,

  loginUrl: `${tenantBaseUrl}/login`,

  adminPortal:
    `${tenantBaseUrl}/login?role=school_admin`,

  teacherPortal:
    `${tenantBaseUrl}/login?role=teacher`,

  parentPortal:
    `${tenantBaseUrl}/login?role=parent`,

  studentPortal:
    `${tenantBaseUrl}/login?role=student`,
};
  } catch (error) {
    console.error(
      "❌ COMPLETE ONBOARDING ERROR:",
      error
    );

    throw error;
  }
}
/**
 * =========================
 * PAYSTACK INIT
 * =========================
 */


export async function initializeOnboardingPayment(payload) {
  let paymentRecord = null;
  let school = null;

  const PLAN_PRICING = {
    monthly: {
      starter: 10000,
      growth: 25000,
      premium: 50000,
    },
    quarterly: {
      starter: 27000,
      growth: 67500,
      premium: 135000,
    },
    yearly: {
      starter: 96000,
      growth: 240000,
      premium: 480000,
    },
  };

  try {
    const email = normalizeEmail(payload.adminEmail);

    if (!email) {
      throw new ApiError(400, "Admin email is required");
    }

    const plan = String(payload.plan || "").toLowerCase();
    const billingCycle = String(
      payload.billingCycle || "monthly"
    ).toLowerCase();

    const amount = PLAN_PRICING[billingCycle]?.[plan];

    if (!amount) {
      throw new ApiError(400, "Invalid plan or billing cycle");
    }

    if (!payload.adminPassword) {
      throw new ApiError(400, "Admin password is required");
    }

    // Find the school or create it through the existing onboarding flow.
    
school = await School.findOne({ email });

if (!school) {
  const created = await completeOnboarding({
    ...payload,
    adminEmail: email,
    plan,
    billingCycle,
    isTrial: false,
  });

  school = await School.findById(created.school._id);

  if (!school) {
    throw new ApiError(
      500,
      "School was created but could not be loaded"
    );
  }
} else {
  // Reuse an existing registration only after verifying ownership.
  await verifyExistingSchoolAdmin(school, {
    ...payload,
    adminEmail: email,
  });

  if (
    school.subscriptionStatus === "active" &&
    school.subscriptionExpiresAt &&
    new Date(school.subscriptionExpiresAt) > new Date()
  ) {
    throw new ApiError(
      409,
      "This school already has an active paid subscription. Please log in."
    );
  }
}

    // Prevent duplicate checkout for an already active subscription.
    if (
      school.onboardingStatus === "active" &&
      school.subscriptionStatus === "active"
    ) {
      throw new ApiError(
        400,
        "School already has an active subscription"
      );
    }

    if (
      school.subscriptionStatus === "active" &&
      school.subscriptionExpiresAt &&
      new Date(school.subscriptionExpiresAt) > new Date()
    ) {
      throw new ApiError(
        400,
        "School already has a valid paid subscription"
      );
    }

    // Load the latest subscription for this school.
    let subscription = await Subscription.findOne({
      schoolId: school._id,
    }).sort({ createdAt: -1 });

    if (!subscription) {
      subscription = await Subscription.create({
        schoolId: school._id,
        plan,
        amount,
        billingCycle,
        status: "pending",
        isTrial: false,
        trialEndsAt: null,
        startsAt: null,
        expiresAt: null,
        enabledModules: [],
      });
    } else {
      subscription.plan = plan;
      subscription.billingCycle = billingCycle;
      subscription.amount = amount;

      // Do not downgrade an existing active or trial subscription.
      if (!["active", "trial"].includes(subscription.status)) {
        subscription.status = "pending";
      }

      await subscription.save();
    }

    // Persist the reference before contacting Paystack.
    const reference = `EDUTRACK-${randomUUID()}`;

    paymentRecord = await SubPayment.create({
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
        plan,
        billingCycle,
        adminEmail: email,
      },
    });

    // Record checkout initiation without activating a paid subscription.
    school.plan = plan;
    school.billingCycle = billingCycle;
    school.onboardingStatus = "payment_initiated";

    if (school.subscriptionStatus !== "trial") {
      school.subscriptionStatus = "pending";
    }

    if (school.billingStatus !== "trial") {
      school.billingStatus = "pending_payment";
    }

    await school.save();

    // Initialize Paystack using the previously recorded reference.
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
        schoolId: String(school._id),
        subscriptionId: String(subscription._id),
        paymentId: String(paymentRecord._id),
        plan,
        billingCycle,
      },
    });

    // Require the exact reference and a valid checkout URL.
    if (
      !payment?.authorizationUrl ||
      !payment?.reference ||
      payment.reference !== reference
    ) {
      paymentRecord.status = "processing";
      paymentRecord.gatewayResponse = {
        stage: "initialization",
        status: "requires_reconciliation",
        message: "Paystack response requires verification",
        returnedReference: payment?.reference || null,
      };

      await paymentRecord.save();

      throw new ApiError(
        502,
        "Payment initialization could not be confirmed. Contact support before retrying."
      );
    }

    paymentRecord.status = "pending";
    paymentRecord.gatewayResponse = {
      stage: "initialization",
      status: "initialized",
      reference: payment.reference,
      accessCode: payment.accessCode || null,
    };

    await paymentRecord.save();

    // Preserve the existing API response contract.
    return {
      authorizationUrl: payment.authorizationUrl,
      reference: payment.reference,
      schoolId: school._id,
      amount,
    };
  } catch (error) {
    const statusCode = Number(error?.statusCode || 0);

    // Only treat a clear client-side rejection as definitive.
    // Gateway errors, timeouts and rate limits remain uncertain.
    const isDefinitiveFailure =
      error instanceof ApiError &&
      statusCode >= 400 &&
      statusCode < 500 &&
      statusCode !== 408 &&
      statusCode !== 429;

    if (paymentRecord) {
      if (isDefinitiveFailure) {
        paymentRecord.status = "failed";
        paymentRecord.failedAt = new Date();
        paymentRecord.gatewayResponse = {
          stage: "initialization",
          status: "failed",
          message: error.message,
          statusCode,
        };
      } else {
        paymentRecord.status = "processing";
        paymentRecord.gatewayResponse = {
          stage: "initialization",
          status: "requires_reconciliation",
          message: error.message,
          statusCode: statusCode || null,
        };
      }

      await paymentRecord.save().catch(() => {
        // Keep the original error as the primary failure.
      });
    }

    // Do not grant trial access for an uncertain payment outcome.
    if (
      isDefinitiveFailure &&
      school &&
      !["active", "trial"].includes(school.subscriptionStatus)
    ) {
      await moveSchoolToTrial(
        school._id,
        `Paystack initialization rejected: ${error.message}`
      ).catch(() => {
        // Trial fallback failure should not mask the payment error.
      });
    }
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      "Payment initialization could not be confirmed. Check the payment status before trying again."
    );
  }
}

export async function verifyOnboardingPayment(
  reference
) {
  const payment =
    await verifyPaystackPayment(
      reference
    );

  if (!payment) {
    throw new ApiError(
      404,
      "Payment not found"
    );
  }

  return payment;
}
