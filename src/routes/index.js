
import express from "express";

import { subdomainMiddleware } from "../middlewares/subdomain.middleware.js";
import { tenantContextMiddleware } from "../middlewares/tenantContex.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import { billingGuard } from "../middlewares/billingGuard.middleware.js";
import gradingScaleRoutes from "../modules/results/grading-scale.routes.js";
// Authentication and public routes
import authRoutes from "../modules/auth/auth.routes.js";
import onboardingRoutes from "../modules/onboarding/onboarding.routes.js";
import tenantResolverRoutes from "../modules/tenant-resolver/tenant-resolver.routes.js";
import resultSchemeRoutes from "../modules/results/result-scheme.routes.js";
// Core modules
import userRoutes from "../modules/users/user.routes.js";
import schoolRoutes from "../modules/schools/school.routes.js";
import sessionRoutes from "../modules/sessions/session.routes.js";
import termRoutes from "../modules/terms/term.routes.js";
import classRoutes from "../modules/classes/class.routes.js";
import subjectRoutes from "../modules/subjects/subject.routes.js";

import timetableSettingRoutes from "../modules/timetables/timetable-setting.routes.js";
import timetableRequirementRoutes from "../modules/timetables/timetable-requirement.routes.js";
import teacherTimetableRoutes from "../modules/timetables/teacher-timetable.routes.js";
import timetableRoutes from "../modules/timetables/timetable.routes.js";
import classTimetableRoutes from "../modules/timetables/class-timetable.routes.js";
import studentTimetableRoutes from "../modules/timetables/student-timetable.routes.js";
import parentTimetableRoutes from "../modules/timetables/parent-timetable.routes.js";
import lessonNoteRoutes from "../modules/lesson-notes/lesson-note.routes.js";
import teacherRoutes from "../modules/teachers/teacher.routes.js";
import parentRoutes from "../modules/parents/parent.routes.js";
import studentRoutes from "../modules/students/student.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import resultRoutes from "../modules/results/result.routes.js";
import announcementRoutes from "../modules/announcements/announcement.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";

// Settings
import schoolProfileRoutes from "../modules/settings/school-profile.routes.js";
import schoolPaymentRoutes from "../modules/settings/school-payment.routes.js";
import optionsRoutes from "../modules/options/options.routes.js";
import traitAssessmentRoutes from "../modules/trait-assessments/trait-assessment.routes.js";
// Super Admin and billing
import superAdminRoutes from "../modules/super-admin/super-admin.routes.js";
import billingRoutes from "../modules/billing/billing.routes.js";
import superAdminBillingRoutes from "../modules/billing/super-admin-billing.routes.js";

// Notifications and activity
import notificationRoutes from "../modules/notifications/notification.routes.js";
import activityRoutes from "../modules/activity/activity.routes.js";

// Exports and reports
import exportRoutes from "../modules/exports/export.routes.js";
import reportCardRoutes from "../modules/report-cards/report-card.routes.js";

// Fees and payments
import parentPaymentRoutes from "../modules/fees/parent-payment.routes.js";
import feePaymentRoutes from "../modules/finance/fees/fee-payment.routes.js";
import receiptRoutes from "../modules/finance/fees/receipt.routes.js";

import {
  getStudentFeesHandler,
  getSchoolInvoices,
} from "../modules/finance/fees/fee-payment.controller.js";

// Existing school Paystack routes
import paystackRoutes from "../modules/finance/payments/paystack.routes.js";

// Portals
import parentPortalRoutes from "../modules/parent-portal/parent-portal.routes.js";
import teacherPortalRoutes from "../modules/teacher-portal/teacher-portal.routes.js";

// Reminders
import reminderRoutes from "../modules/reminders/reminder.routes.js";

const router = express.Router();

/**
 * HEALTH CHECK
 */
router.get("/health", (req, res) => {
  return res.json({
    success: true,
    message: "EduTrack API Running",
  });
});

/**
 * PUBLIC ROUTES
 */
router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/public", tenantResolverRoutes);

// Preserve existing school Paystack endpoints.
router.use("/finance/paystack", paystackRoutes);

/**
 * AUTHENTICATION
 *
 * Requests below require a valid authenticated user unless
 * they were handled by one of the public routes above.
 */
router.use(protect);

/**
 * SUPER ADMIN ROUTES
 *
 * These MUST be mounted before tenantContextMiddleware.
 * Super Admin users may not have a schoolId.
 *
 * Both routers enforce their own Super Admin authorization.
 */
router.use("/super-admin/billing", superAdminBillingRoutes);
router.use("/super-admin", superAdminRoutes);

/**
 * EXISTING SCHOOL BILLING
 *
 * Preserve renewal, upgrade, verification, and school billing
 * behavior separately from Super Admin management.
 */
router.use("/billing", billingRoutes);

/**
 * TENANT RESOLUTION
 *
 * School-specific routes below continue to require tenant context
 * and pass through the existing billing guard.
 */
router.use(subdomainMiddleware);
router.use(tenantContextMiddleware);
router.use(billingGuard);

/**
 * CORE MODULES
 */
router.use("/users", userRoutes);
router.use("/schools", schoolRoutes);
router.use("/sessions", sessionRoutes);
router.use("/terms", termRoutes);
router.use("/classes", classRoutes);
router.use("/subjects", subjectRoutes);

router.use("/timetable-settings", timetableSettingRoutes);
router.use("/timetable-requirements", timetableRequirementRoutes);
router.use("/timetables", timetableRoutes);

router.use("/teacher/timetable", teacherTimetableRoutes);
router.use("/class/timetable", classTimetableRoutes);
router.use("/student/timetable", studentTimetableRoutes);
router.use("/parent/timetable", parentTimetableRoutes);

router.use("/teachers", teacherRoutes);
router.use("/parents", parentRoutes);
router.use("/students", studentRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/results", resultRoutes);
router.use("/grading-scale", gradingScaleRoutes);
router.use("/result-scheme", resultSchemeRoutes);
router.use("/announcements", announcementRoutes);

/**
 * DASHBOARD
 */
router.use("/dashboard", dashboardRoutes);

/**
 * SETTINGS
 */
router.use("/settings/school-profile", schoolProfileRoutes);
router.use("/settings/school-payment", schoolPaymentRoutes);
router.use("/options", optionsRoutes);

/**
 * NOTIFICATIONS AND ACTIVITY
 */
router.use("/notifications", notificationRoutes);
router.use("/activity", activityRoutes);

/**
 * EXPORTS AND REPORT CARDS
 */
router.use("/exports", exportRoutes);
router.use("/report-cards", reportCardRoutes);
router.use("/trait-assessments", traitAssessmentRoutes);
/**
 * FEES AND PAYMENTS
 */
router.use("/receipts", receiptRoutes);
router.use("/parent-payments", parentPaymentRoutes);
router.use("/finance/fees", feePaymentRoutes);

router.get(
  "/finance/fees/student-fees",
  getStudentFeesHandler
);

// Preserve the existing school invoice endpoint.
router.get("/invoices", getSchoolInvoices);

/**
 * PORTALS
 */
router.use("/parent", parentPortalRoutes);
router.use("/teacher", teacherPortalRoutes);
router.use("/lesson-notes", lessonNoteRoutes);
/**
 * REMINDERS
 */
router.use("/reminders", reminderRoutes);

/**
 * 404
 */
router.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

export default router;
