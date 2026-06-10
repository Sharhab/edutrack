import { School } from "../schools/school.model.js";
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

  const recentTenants = await School.find().sort({ createdAt: -1 }).limit(5);
  const recentPayments = await Payment.find()
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
  const doc = await School.findByIdAndDelete(id);

  if (!doc) {
    throw new ApiError(404, "Tenant not found");
  }

  return { deleted: true };
}

export async function controlTenant(id, payload) {
  const doc = await School.findById(id);

  if (!doc) {
    throw new ApiError(404, "Tenant not found");
  }

  if (payload.isActive !== undefined) doc.isActive = payload.isActive;
  if (payload.subscriptionStatus !== undefined) {
    doc.subscriptionStatus = payload.subscriptionStatus;
  }
  if (payload.expiryDate !== undefined) {
    doc.expiryDate = payload.expiryDate || null;
  }

  await doc.save();
  return doc;
}