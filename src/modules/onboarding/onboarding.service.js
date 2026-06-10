import slugify from "slugify";
import bcrypt from "bcryptjs";
import axios from "axios";
import { Subscription } from "../billing/subscription.model.js";
import { School } from "../schools/school.model.js";
import { User } from "../users/user.model.js";
import { bootstrapSchoolData } from "./bootstrap.service.js";
import { ApiError } from "../../utils/apiError.js";
import { initializePaystackPayment } from "../billing/paystack.service.js";
import { generateUniqueSlug } from "../../utils/slug.js";
import { verifyPaystackPayment }
  from "../billing/paystack.service.js";
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

  if (existingUser) {
    throw new ApiError(400, "Admin email already exists");
  }
}

export async function syncSchoolBilling(schoolId, subscription) {
  const school = await School.findById(schoolId);

  if (!school) return;

  school.plan = subscription.plan;
  school.billingCycle = subscription.billingCycle;
  school.subscriptionStatus = subscription.status;

  school.subscriptionStartedAt = subscription.startsAt;
  school.subscriptionExpiresAt = subscription.expiresAt;

  school.trialStartAt = subscription.trialStartAt || null;
  school.trialEndsAt = subscription.trialEndsAt || null;

  school.isActive = subscription.status === "active";

  await school.save();
}

/**
 * =========================
 * CREATE SCHOOL + ADMIN
 * =========================
 */

export async function completeOnboarding(payload) {
  try {
    log("START ONBOARDING", payload);

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

      // Public school landing page
      landingPage: `/school/${school.slug}`,

      // Tenant login page
      loginUrl: `/school/${school.slug}/login`,

      // Future role portals
      adminPortal: `/school/${school.slug}/login?role=school_admin`,

      teacherPortal: `/school/${school.slug}/login?role=teacher`,

      parentPortal: `/school/${school.slug}/login?role=parent`,

      studentPortal: `/school/${school.slug}/login?role=student`,
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
  try {
    const email = normalizeEmail(payload.adminEmail);

    log("INIT PAYMENT", {
      email,
      plan: payload.plan,
      billingCycle: payload.billingCycle,
    });

    /**
     * =========================
     * SAFE PRICING (NAIRA ONLY)
     * =========================
     */
    const PLAN_PRICING = {
      monthly: {
        starter: 500,
        growth: 20000,
        premium: 40000,
      },
      quarterly: {
        starter: 1500,
        growth: 60000,
        premium: 120000,
      },
      yearly: {
        starter: 5000,
        growth: 200000,
        premium: 450000,
      },
    };

    const amount =
      PLAN_PRICING?.[payload.billingCycle]?.[payload.plan];

    if (!amount) {
      throw new ApiError(400, "Invalid plan or billing cycle");
    }

    log("Calculated amount (NGN)", { amount });

    /**
     * FIND OR CREATE SCHOOL
     */
    let school = await School.findOne({ email });

    if (!school) {
      log("School not found → creating");

      const created = await completeOnboarding(payload);
      school = created.school;
    }

    /**
     * PREVENT DOUBLE PAYMENT FLOW
     */
    if (school.onboardingStatus === "active") {
      throw new ApiError(400, "School already activated");
    }

    school.onboardingStatus = "payment_initiated";
    await school.save();

    log("Status updated → payment_initiated");

    /**
     * PAYSTACK (IMPORTANT: KOBO ONLY HERE)
     */
    const payment = await initializePaystackPayment({
      schoolId: school._id,
      email: school.email,

      // FIX: convert ONLY here
      amount: amount,

      plan: payload.plan,
      billingCycle: payload.billingCycle,
      callbackUrl: payload.callbackUrl,
    });

    log("PAYSTACK RESPONSE", payment);

    return {
      authorizationUrl: payment.authorizationUrl,
      reference: payment.reference,
      schoolId: school._id,

      // RETURN CLEAN NGN (NOT KOBO)
      amount,
    };
  } catch (error) {
    console.error("❌ INIT PAYMENT ERROR:", error);

    if (error instanceof ApiError) throw error;

    throw new ApiError(
      500,
      error.message || "Payment initialization failed"
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