
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
  const doc = await School.findById(id);

  if (!doc) {
    throw new ApiError(404, "Tenant not found");
  }

  if (payload.isActive !== undefined) {
    doc.isActive = payload.isActive;
  }

  if (payload.subscriptionStatus !== undefined) {
    doc.subscriptionStatus = payload.subscriptionStatus;
  }

  if (payload.expiryDate !== undefined) {
    doc.subscriptionExpiresAt = payload.expiryDate
      ? new Date(payload.expiryDate)
      : null;
  }

  await doc.save();

  return doc;
}
