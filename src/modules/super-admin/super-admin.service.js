
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

  const allowedStatuses = [
    "trial",
    "inactive",
    "pending",
    "active",
    "past_due",
    "expired",
    "cancelled",
  ];

  if (
    payload.subscriptionStatus !== undefined &&
    !allowedStatuses.includes(payload.subscriptionStatus)
  ) {
    throw new ApiError(400, "Invalid subscription status");
  }

  if (payload.expiryDate !== undefined) {
    if (payload.expiryDate === null || payload.expiryDate === "") {
      school.subscriptionExpiresAt = null;
    } else {
      const expiry = new Date(payload.expiryDate);

      if (Number.isNaN(expiry.getTime())) {
        throw new ApiError(400, "Invalid subscription expiry date");
      }

      school.subscriptionExpiresAt = expiry;
    }
  }

  if (payload.subscriptionStatus !== undefined) {
    school.subscriptionStatus = payload.subscriptionStatus;

    switch (payload.subscriptionStatus) {
      case "trial":
        school.billingStatus = "trial";
        school.onboardingStatus = "active";
        school.isActive = true;
        break;

      case "active":
        school.billingStatus = "active";
        school.onboardingStatus = "active";
        school.isActive = true;
        break;

      case "pending":
        school.billingStatus = "pending_payment";
        school.onboardingStatus = "payment_initiated";
        school.isActive = false;
        break;

      case "past_due":
        school.billingStatus = "pending_payment";
        break;

      case "expired":
      case "cancelled":
      case "inactive":
        school.billingStatus = "expired";
        school.onboardingStatus = "suspended";
        school.isActive = false;
        break;
    }
  }

  // Explicit access control takes precedence, except that an expired
  // subscription must not be reactivated through the access toggle.
  if (payload.isActive !== undefined) {
    if (
      payload.isActive === true &&
      ["expired", "cancelled", "inactive"].includes(
        school.subscriptionStatus
      )
    ) {
      throw new ApiError(
        400,
        "Renew or update the subscription before reactivating this school"
      );
    }

    school.isActive = payload.isActive;
  }

  // Do not allow a subscription marked active to remain active
  // when its recorded expiry date has already passed.
  if (
    school.subscriptionStatus === "active" &&
    school.subscriptionExpiresAt &&
    school.subscriptionExpiresAt <= new Date()
  ) {
    school.subscriptionStatus = "expired";
    school.billingStatus = "expired";
    school.onboardingStatus = "suspended";
    school.isActive = false;
  }

  await school.save();

  return school;
}
