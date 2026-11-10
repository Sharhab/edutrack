
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
export async function getSchoolMonitoring() {
  const now = new Date();

  // An administrator is considered active if they logged in
  // within the last 7 days and their account is enabled.
  const activeSince = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  );

  const [schools, studentCounts, schoolAdmins] =
    await Promise.all([
      School.find()
        .select(
          "name slug email phone isActive plan subscriptionStatus billingStatus createdAt"
        )
        .sort({ createdAt: -1 })
        .lean(),

      Student.aggregate([
        {
          $group: {
            _id: "$schoolId",
            totalStudents: { $sum: 1 },
            activeStudents: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "active"] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      User.find({
        role: "school_admin",
      })
        .select(
          "schoolId firstName lastName email isActive lastLogin"
        )
        .lean(),
    ]);

  const studentCountMap = new Map(
    studentCounts.map((item) => [
      String(item._id),
      {
        totalStudents: item.totalStudents,
        activeStudents: item.activeStudents,
      },
    ])
  );

  const adminMap = new Map();

  for (const admin of schoolAdmins) {
    const schoolId = String(admin.schoolId);

    if (!adminMap.has(schoolId)) {
      adminMap.set(schoolId, []);
    }

    let status = "never_logged_in";

    if (!admin.isActive) {
      status = "disabled";
    } else if (admin.lastLogin) {
      status =
        new Date(admin.lastLogin) >= activeSince
          ? "active"
          : "inactive";
    }

    adminMap.get(schoolId).push({
      _id: admin._id,
      name: `${admin.firstName || ""} ${
        admin.lastName || ""
      }`.trim(),
      email: admin.email,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin || null,
      status,
    });
  }

  const monitoredSchools = schools.map((school) => {
    const schoolId = String(school._id);

    const counts = studentCountMap.get(schoolId) || {
      totalStudents: 0,
      activeStudents: 0,
    };

    const admins = adminMap.get(schoolId) || [];

    return {
      _id: school._id,
      name: school.name,
      slug: school.slug,
      email: school.email,
      phone: school.phone,
      isActive: school.isActive,
      plan: school.plan,
      subscriptionStatus: school.subscriptionStatus,
      billingStatus: school.billingStatus,

      totalStudents: counts.totalStudents,
      activeStudents: counts.activeStudents,

      schoolAdmins: admins,

      adminStatus: admins.some(
        (admin) => admin.status === "active"
      )
        ? "active"
        : admins.some(
            (admin) => admin.status === "inactive"
          )
          ? "inactive"
          : admins.some(
              (admin) => admin.status === "disabled"
            )
            ? "disabled"
            : "never_logged_in",

      lastAdminLogin: admins
        .filter((admin) => admin.lastLogin)
        .sort(
          (a, b) =>
            new Date(b.lastLogin) -
            new Date(a.lastLogin)
        )[0]?.lastLogin || null,
    };
  });

  const totalStudents = monitoredSchools.reduce(
    (sum, school) => sum + school.totalStudents,
    0
  );

  const activeSchools = monitoredSchools.filter(
    (school) => school.adminStatus === "active"
  ).length;

  const inactiveSchools = monitoredSchools.filter(
    (school) => school.adminStatus === "inactive"
  ).length;

  const neverLoggedInSchools = monitoredSchools.filter(
    (school) => school.adminStatus === "never_logged_in"
  ).length;

  return {
    summary: {
      totalSchools: monitoredSchools.length,
      totalStudents,
      activeSchools,
      inactiveSchools,
      neverLoggedInSchools,
    },
    schools: monitoredSchools,
    activeSince,
  };
}
