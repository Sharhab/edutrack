import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getSchoolAdminDashboardHandler,
  getTeacherDashboardHandler,
  getParentDashboardHandler,
  getParentChildSummaryHandler,
} from "./dashboard.controller.js";

import {
  parentChartsHandler,
  parentChildChartsHandler,
  schoolAdminChartsHandler,
  superAdminChartsHandler,
  teacherChartsHandler,
} from "./dashboard-charts.controller.js";

const router = express.Router();

/* =========================================
   AUTH
========================================= */
router.use(protect);

/* =========================================
   SCHOOL ADMIN DASHBOARD
========================================= */
router.get(
  "/school-admin",
  authorize("school_admin"),
  asyncHandler(getSchoolAdminDashboardHandler)
);

router.get(
  "/school-admin/charts",
  authorize("school_admin"),
  asyncHandler(schoolAdminChartsHandler)
);

/* =========================================
   TEACHER DASHBOARD
========================================= */
router.get(
  "/teacher",
  authorize("teacher"),
  asyncHandler(getTeacherDashboardHandler)
);

router.get(
  "/teacher/charts",
  authorize("teacher"),
  asyncHandler(teacherChartsHandler)
);

/* =========================================
   PARENT DASHBOARD
========================================= */
router.get(
  "/parent",
  authorize("parent"),
  asyncHandler(getParentDashboardHandler)
);

router.get(
  "/parent/charts",
  authorize("parent"),
  asyncHandler(parentChartsHandler)
);

router.get(
  "/parent/child/:studentId",
  authorize("parent"),
  asyncHandler(getParentChildSummaryHandler)
);

router.get(
  "/parent/child/:studentId/charts",
  authorize("parent"),
  asyncHandler(parentChildChartsHandler)
);

/* =========================================
   SUPER ADMIN
========================================= */
router.get(
  "/super-admin/charts",
  authorize("super_admin"),
  asyncHandler(superAdminChartsHandler)
);

/* =========================================
   FINANCE DASHBOARD
========================================= */
router.get(
  "/school-admin/finance",
  authorize("school_admin"),
  asyncHandler(async (req, res) => {
    const service = await import(
      "./dashboard.service.js"
    );

    const data =
      await service.getSchoolAdminDashboard(
        req.user
      );

    res.json({
      success: true,
      message:
        "Finance dashboard fetched successfully",
      data: {
        finance:
          data.finance || {},

        invoices:
          data.invoices || {},
      },
    });
  })
);

export default router;