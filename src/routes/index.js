import express from "express";

import { subdomainMiddleware } from "../middlewares/subdomain.middleware.js";
import { tenantContextMiddleware } from "../middlewares/tenantContex.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import { billingGuard } from "../middlewares/billingGuard.middleware.js";
/**
 * AUTH
 */
import authRoutes from "../modules/auth/auth.routes.js";

/**
 * ONBOARDING
 */
import onboardingRoutes from "../modules/onboarding/onboarding.routes.js";

/**
 * TENANT RESOLVER
 */
import tenantResolverRoutes from "../modules/tenant-resolver/tenant-resolver.routes.js";

/**
 * CORE MODULES
 */
import userRoutes from "../modules/users/user.routes.js";
import schoolRoutes from "../modules/schools/school.routes.js";
import sessionRoutes from "../modules/sessions/session.routes.js";
import termRoutes from "../modules/terms/term.routes.js";
import classRoutes from "../modules/classes/class.routes.js";
import subjectRoutes from "../modules/subjects/subject.routes.js";
import teacherRoutes from "../modules/teachers/teacher.routes.js";
import parentRoutes from "../modules/parents/parent.routes.js";
import studentRoutes from "../modules/students/student.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import resultRoutes from "../modules/results/result.routes.js";
import announcementRoutes from "../modules/announcements/announcement.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";

/**
 * SETTINGS
 */
import schoolProfileRoutes from "../modules/settings/school-profile.routes.js";
import optionsRoutes from "../modules/options/options.routes.js";

/**
 * SUPER ADMIN
 */
import superAdminRoutes from "../modules/super-admin/super-admin.routes.js";
import billingRoutes from "../modules/billing/billing.routes.js";

/**
 * NOTIFICATIONS
 */
import notificationRoutes from "../modules/notifications/notification.routes.js";
import activityRoutes from "../modules/activity/activity.routes.js";

/**
 * EXPORTS
 */
import exportRoutes from "../modules/exports/export.routes.js";
import reportCardRoutes from "../modules/report-cards/report-card.routes.js";

/**
 * FINANCE
 */
import parentPaymentRoutes from "../modules/fees/parent-payment.routes.js";
import feePaymentRoutes from "../modules/finance/fees/fee-payment.routes.js";
import receiptRoutes from "../modules/finance/fees/receipt.routes.js";

import {
  getStudentFeesHandler,
  getSchoolInvoices,
} from "../modules/finance/fees/fee-payment.controller.js";

/**
 * PAYSTACK (EXISTING SCHOOLS)
 */
import paystackRoutes from "../modules/finance/payments/paystack.routes.js";

/**
 * PORTALS
 */
import parentPortalRoutes from "../modules/parent-portal/parent-portal.routes.js";
import teacherPortalRoutes from "../modules/teacher-portal/teacher-portal.routes.js";

/**
 * REMINDERS
 */
import reminderRoutes from "../modules/reminders/reminder.routes.js";

const router = express.Router();

/**
 * =====================================
 * HEALTH CHECK
 * =====================================
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "EduTrack API Running",
  });
});

/**
 * =====================================
 * PUBLIC ROUTES
 * =====================================
 */

/**
 * AUTH
 */
router.use("/auth", authRoutes);

/**
 * ONBOARDING
 *
 * Includes:
 * POST /onboarding
 * POST /onboarding/paystack/initialize
 * GET  /onboarding/paystack/verify/:reference
 * POST /onboarding/paystack/webhook
 */
router.use("/onboarding", onboardingRoutes);

/**
 * PUBLIC TENANT LOOKUP
 */
router.use("/public", tenantResolverRoutes);

/**
 * SCHOOL BILLING PAYSTACK
 * (Authenticated schools only)
 */
router.use("/finance/paystack", paystackRoutes);

/**
 * =====================================
 * AUTH REQUIRED
 * =====================================
 */
router.use(protect);

router.use(
  "/billing",
  billingRoutes
);
/**
 * =====================================
 * TENANT RESOLUTION
 * =====================================
 */

router.use((req, res, next) => {
  console.log("REQUEST HIT:", req.method, req.originalUrl);
  next();
});

router.use(subdomainMiddleware);
router.use(tenantContextMiddleware);
router.use(billingGuard); 

/**
 * =====================================
 * CORE MODULES
 * =====================================
 */
router.use("/users", userRoutes);
router.use("/schools", schoolRoutes);
router.use("/sessions", sessionRoutes);
router.use("/terms", termRoutes);
router.use("/classes", classRoutes);
router.use("/subjects", subjectRoutes);

router.use("/teachers", teacherRoutes);
router.use("/parents", parentRoutes);
router.use("/students", studentRoutes);

router.use("/attendance", attendanceRoutes);
router.use("/results", resultRoutes);
router.use("/announcements", announcementRoutes);

router.use((req, res, next) => {
  console.log("REQUEST:", req.originalUrl);
  next();
});

router.use(subdomainMiddleware);

router.use((req, res, next) => {
  console.log("PASSED SUBDOMAIN");
  next();
});

router.use(tenantContextMiddleware);

router.use((req, res, next) => {
  console.log("PASSED TENANT");
  next();
});

router.use(billingGuard);

router.use((req, res, next) => {
  console.log("PASSED BILLING");
  next();
});

router.use("/dashboard", dashboardRoutes);

/**
 * =====================================
 * SETTINGS
 * =====================================
 */
router.use(
  "/settings/school-profile",
  schoolProfileRoutes
);

router.use("/options", optionsRoutes);

/**
 * =====================================
 * SUPER ADMIN
 * =====================================
 */
router.use("/super-admin", superAdminRoutes);

/**
 * =====================================
 * NOTIFICATIONS
 * =====================================
 */
router.use(
  "/notifications",
  notificationRoutes
);

router.use("/activity", activityRoutes);

/**
 * =====================================
 * EXPORTS / REPORTS
 * =====================================
 */
router.use("/exports", exportRoutes);

router.use(
  "/report-cards",
  reportCardRoutes
);

/**
 * =====================================
 * FEES / PAYMENTS
 * =====================================
 */
router.use("/receipts", receiptRoutes);

router.use(
  "/parent-payments",
  parentPaymentRoutes
);

router.use(
  "/finance/fees",
  feePaymentRoutes
);

/**
 * CUSTOM ENDPOINTS
 */
router.get(
  "/finance/fees/student-fees",
  getStudentFeesHandler
);

router.get(
  "/invoices",
  getSchoolInvoices
);

/**
 * =====================================
 * PORTALS
 * =====================================
 */
router.use("/parent", parentPortalRoutes);

router.use(
  "/teacher",
  teacherPortalRoutes
);

/**
 * =====================================
 * REMINDERS
 * =====================================
 */
router.use("/reminders", reminderRoutes);

/**
 * =====================================
 * 404
 * =====================================
 */
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

export default router;