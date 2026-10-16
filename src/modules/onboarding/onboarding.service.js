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
    throw new ApiError(404, "School not found during billing sync");
  }

  school.plan = subscription.plan;
  school.billingCycle = subscription.billingCycle;
  school.subscriptionStatus = subscription.status;

  school.subscriptionStartedAt =
    subscription.startsAt ?? null;
  school.subscriptionExpiresAt =
    subscription.expiresAt ?? null;

  const isTrial =
    subscription.status === "trial" &&
    subscription.isTrial === true;

  school.trialStartAt = isTrial
    ? subscription.startsAt ?? new Date()
    : null;

  school.trialEndsAt = isTrial
    ? subscription.trialEndsAt ?? null
    : null;

  if (subscription.status === "active") {
    school.billingStatus = "active";
    school.isActive = true;
    school.onboardingStatus = "active";
  } else if (isTrial) {
    school.billingStatus = "trial";
    school.isActive = Boolean(
      school.trialEndsAt &&
      new Date(school.trialEndsAt) > new Date()
    );
    school.onboardingStatus = school.isActive
      ? "active"
      : "suspended";
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

  try {
    const email = normalizeEmail(payload.adminEmail);

    if (!email) {
      throw new ApiError(400, "Admin email is required");
    }

    log("INIT PAYMENT", {
      email,
      plan: payload.plan,
      billingCycle: payload.billingCycle,
    });

    // 1. Authoritative pricing in NGN.
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

    const plan = String(payload.plan || "").toLowerCase();
    const billingCycle = String(
      payload.billingCycle || "monthly"
    ).toLowerCase();

    const amount = PLAN_PRICING[billingCycle]?.[plan];

    if (!amount) {
      throw new ApiError(
        400,
        "Invalid plan or billing cycle"
      );
    }

    if (!payload.adminPassword) {
      throw new ApiError(
        400,
        "Admin password is required"
      );
    }

    // 2. Find the school or create it through the existing
    // onboarding flow. Re-fetch a real Mongoose document.
    school = await School.findOne({ email });

    if (!school) {
      log("School not found; creating onboarding records");

      const created = await completeOnboarding({
        ...payload,
        adminEmail: email,
        plan,
        billingCycle,
      });

      school = await School.findById(created.school._id);

      if (!school) {
        throw new ApiError(
          500,
          "School was created but could not be loaded"
        );
      }
    }

    // 3. Preserve the existing guard against paying again
    // for an already activated school.
    if (
      school.onboardingStatus === "active" &&
      school.subscriptionStatus === "active"
    ) {
      throw new ApiError(
        400,
        "School already has an active subscription"
      );
    }

    // Do not overwrite an active subscription accidentally.
    // Trial schools should use the intended upgrade flow.
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

    // 4. Find this school's subscription record.
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
      // Update the selected plan without activating it.
      subscription.plan = plan;
      subscription.billingCycle = billingCycle;
      subscription.amount = amount;

      if (
        !["active", "trial"].includes(subscription.status)
      ) {
        subscription.status = "pending";
      }

      await subscription.save();
    }

    // 5. Generate and persist the reference BEFORE calling
    // Paystack. This allows reconciliation if the network
    // fails after Paystack receives the initialization request.
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

    // Record that checkout was initiated, but do not mark
    // the subscription paid or active here.
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

    log("PAYSTACK INITIALIZATION STARTED", {
      schoolId: String(school._id),
      subscriptionId: String(subscription._id),
      paymentId: String(paymentRecord._id),
      reference,
      amount,
      currency: "NGN",
    });

    // 6. Initialize Paystack. The payment service must accept
    // payload.reference and send it to Paystack as `reference`.
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

    // 7. Ensure Paystack returned the reference we recorded.
    if (
      !payment?.authorizationUrl ||
      !payment?.reference ||
      payment.reference !== reference
    ) {
      // Keep the attempt recorded for investigation.
      paymentRecord.status = "processing";
      paymentRecord.gatewayResponse = {
        stage: "initialization",
        message:
          "Paystack response requires reconciliation",
        returnedReference: payment?.reference || null,
      };

      await paymentRecord.save();

      throw new ApiError(
        502,
        "Payment initialization needs verification. Please contact support before retrying."
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

    log("PAYSTACK CHECKOUT READY", {
      schoolId: String(school._id),
      reference,
      amount,
    });

    // Preserve the existing response contract.
    return {
      authorizationUrl: payment.authorizationUrl,
      reference: payment.reference,
      schoolId: school._id,
      amount,
    };
  } catch (error) {
    console.error("ONBOARDING PAYMENT INITIALIZATION ERROR:", {
      message: error.message,
      statusCode: error.statusCode,
      schoolId: school?._id
        ? String(school._id)
        : null,
      reference: paymentRecord?.reference || null,
    });

    // Only classify an attempt as failed when Paystack has
    // explicitly rejected the request. A network timeout or
    // unknown error is ambiguous: Paystack may have received it.
    if (paymentRecord && error instanceof ApiError) {
      paymentRecord.status = "failed";
      paymentRecord.failedAt = new Date();
      paymentRecord.gatewayResponse = {
        stage: "initialization",
        status: "failed",
        message: error.message,
        statusCode: error.statusCode || null,
      };

      await paymentRecord.save().catch((saveError) => {
        console.error(
          "FAILED TO RECORD PAYMENT INITIALIZATION ERROR:",
          saveError.message
        );
      });

      // Keep the school eligible for trial access when payment
      // initialization is definitively rejected. Never apply
      // this fallback to an ambiguous network outcome.
      if (
        school &&
        error.statusCode === 400 &&
        !["active", "trial"].includes(
          school.subscriptionStatus
        )
      ) {
        try {
          await moveSchoolToTrial(
            school._id,
            `Paystack initialization rejected: ${error.message}`
          );
        } catch (trialError) {
          console.error(
            "FAILED TO APPLY TRIAL FALLBACK:",
            trialError.message
          );
        }
      }
    } else if (paymentRecord) {
      // Preserve the attempt for later verification instead
      // of incorrectly declaring an unknown result a failure.
      paymentRecord.status = "processing";
      paymentRecord.gatewayResponse = {
        stage: "initialization",
        status: "requires_reconciliation",
        message: error.message,
      };

      await paymentRecord.save().catch((saveError) => {
        console.error(
          "FAILED TO RECORD RECONCILIATION STATE:",
          saveError.message
        );
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
