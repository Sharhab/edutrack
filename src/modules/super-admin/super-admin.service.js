
import { School } from "../schools/school.model.js";
import { User } from "../users/user.model.js";
import { Student } from "../students/student.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Parent } from "../parents/parent.model.js";
import { Subscription } from "../billing/subscription.model.js";
import { SubPayment } from "../billing/sub-payment.model.js";
import { SuperInvoice } from "../billing/super-invoice.model.js";
import { ApiError } from "../../utils/apiError.js";
import { updateSchool } from "../schools/school.service.js";

export async function getSuperAdminDashboard() {
  const [
    totalTenants,
    activeTenants,
    inactiveTenants,
    totalStudents,
    totalTeachers,
    totalParents,
    totalSubscriptions,
    activeSubscriptions,
    totalPayments,
    totalInvoices,
  ] = await Promise.all([
    School.countDocuments(),
    School.countDocuments({ isActive: true }),
    School.countDocuments({ isActive: false }),
    Student.countDocuments(),
    Teacher.countDocuments(),
    Parent.countDocuments(),
    Subscription.countDocuments(),
    Subscription.countDocuments({ status: "active" }),
    SubPayment.countDocuments(),
    SuperInvoice.countDocuments(),
  ]);

  const recentTenants = await School.find()
    .sort({ createdAt: -1 })
    .limit(5);

  const recentPayments = await SubPayment.find()
    .populate("schoolId", "name slug email")
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    stats: {
      totalTenants,
      activeTenants,
      inactiveTenants,
      totalStudents,
      totalTeachers,
      totalParents,
      totalSubscriptions,
      activeSubscriptions,
      totalPayments,
      totalInvoices,
    },
    recentTenants,
    recentPayments,
  };
}

export async function getTenants() {
  return School.find().sort({ createdAt: -1 });
}

export async function getTenantById(id) {
  const doc = await School.findById(id);

  if (!doc) {
    throw new ApiError(404, "Tenant not found");
  }

  return doc;
}

export async function updateTenant(id, payload) {
  return updateSchool(id, payload);
}

export async function deleteTenant(id) {
  const doc = await School.findById(id);

  if (!doc) {
    throw new ApiError(404, "Tenant not found");
  }

  // Delete the tenant first. Keep billing records for auditing.
  await doc.deleteOne();

  // Remove only admin accounts belonging to this deleted school.
  // Never delete users belonging to other schools.
  await User.deleteMany({
    schoolId: doc._id,
    role: "school_admin",
  });

  return { deleted: true };
}



export async function controlTenant(id, payload) {
  const school = await School.findById(id);

  if (!school) {
    throw new ApiError(404, "Tenant not found");
  }

  const now = new Date();

  const has = (key) =>
    Object.prototype.hasOwnProperty.call(payload, key);

  // Update plan and billing cycle.
  if (has("plan")) {
    school.plan = payload.plan;
  }

  if (has("billingCycle")) {
    school.billingCycle = payload.billingCycle;
  }

  // Update trial dates independently from paid subscription expiry.
  if (has("trialStartAt")) {
    school.trialStartAt = payload.trialStartAt
      ? new Date(payload.trialStartAt)
      : null;
  }

  if (has("trialEndsAt")) {
    school.trialEndsAt = payload.trialEndsAt
      ? new Date(payload.trialEndsAt)
      : null;
  }

  if (
    school.trialStartAt &&
    school.trialEndsAt &&
    school.trialEndsAt <= school.trialStartAt
  ) {
    throw new ApiError(
      400,
      "Trial end date must be after the trial start date"
    );
  }

  if (has("expiryDate")) {
    school.subscriptionExpiresAt = payload.expiryDate
      ? new Date(payload.expiryDate)
      : null;
  }

  const requestedStatus = payload.subscriptionStatus;

  if (requestedStatus === "trial") {
    const trialStart = school.trialStartAt || now;
    const trialEnd = school.trialEndsAt;

    if (!trialEnd || trialEnd <= now) {
      throw new ApiError(
        400,
        "Set a future trial end date before activating a trial"
      );
    }

    school.trialStartAt = trialStart;
    school.trialEndsAt = trialEnd;
    school.subscriptionStatus = "trial";
    school.billingStatus = "trial";
    school.subscriptionStartedAt = trialStart;
    school.subscriptionExpiresAt = null;
    school.onboardingStatus = "active";
    school.isActive = true;

    await Subscription.findOneAndUpdate(
      { schoolId: school._id },
      {
        $set: {
          plan: school.plan,
          billingCycle: school.billingCycle,
          status: "trial",
          isTrial: true,
          startsAt: trialStart,
          trialEndsAt: trialEnd,
          expiresAt: null,
          amount: 0,
        },
      },
      { new: true, sort: { createdAt: -1 } }
    );
  } else if (requestedStatus === "active") {
    const expiry = school.subscriptionExpiresAt;

    if (!expiry || expiry <= now) {
      throw new ApiError(
        400,
        "Set a future paid subscription expiry date before activating this school"
      );
    }

    school.subscriptionStatus = "active";
    school.billingStatus = "active";
    school.subscriptionStartedAt =
      school.subscriptionStartedAt || now;
    school.trialStartAt = null;
    school.trialEndsAt = null;
    school.onboardingStatus = "active";
    school.isActive = true;

    await Subscription.findOneAndUpdate(
      { schoolId: school._id },
      {
        $set: {
          plan: school.plan,
          billingCycle: school.billingCycle,
          status: "active",
          isTrial: false,
          startsAt: school.subscriptionStartedAt,
          expiresAt: expiry,
        },
      },
      { new: true, sort: { createdAt: -1 } }
    );
  } else if (requestedStatus === "pending") {
    school.subscriptionStatus = "pending";
    school.billingStatus = "pending_payment";
    school.onboardingStatus = "payment_initiated";
  } else if (requestedStatus === "past_due") {
    school.subscriptionStatus = "past_due";
    school.billingStatus = "blocked";
    school.isActive = false;
  } else if (
    ["expired", "cancelled", "inactive"].includes(requestedStatus)
  ) {
    school.subscriptionStatus = requestedStatus;
    school.billingStatus = "expired";
    school.onboardingStatus = "suspended";
    school.isActive = false;

    await Subscription.updateMany(
      { schoolId: school._id, status: { $in: ["active", "trial"] } },
      {
        $set: {
          status:
            requestedStatus === "cancelled"
              ? "cancelled"
              : "expired",
        },
      }
    );
  }

  // Explicit access control.
  if (has("isActive")) {
    if (
      payload.isActive === true &&
      ["expired", "cancelled", "inactive", "past_due"].includes(
        school.subscriptionStatus
      )
    ) {
      throw new ApiError(
        400,
        "Set a valid trial or paid subscription before enabling school access"
      );
    }

    school.isActive = payload.isActive;
  }

  // Don't leave an expired paid subscription marked active.
  if (
    school.subscriptionStatus === "active" &&
    school.subscriptionExpiresAt &&
    school.subscriptionExpiresAt <= now
  ) {
    school.subscriptionStatus = "expired";
    school.billingStatus = "expired";
    school.onboardingStatus = "suspended";
    school.isActive = false;
  }

  await school.save();

  return school;
}
