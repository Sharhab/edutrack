import {
  getParentChildSummary,
  getParentDashboard,
  getSchoolAdminDashboard,
  getTeacherDashboard,
} from "./dashboard.service.js";

/* =========================================
   SCHOOL ADMIN DASHBOARD
========================================= */
export async function getSchoolAdminDashboardHandler(
  req,
  res,
  next
) {
  try {
    const data =
      await getSchoolAdminDashboard(
        req.user
      );

    return res.json({
      success: true,
      message:
        "School admin dashboard fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   PARENT DASHBOARD
========================================= */
export async function getParentDashboardHandler(
  req,
  res,
  next
) {
  try {
    const data =
      await getParentDashboard(
        req.user
      );

    return res.json({
      success: true,
      message:
        "Parent dashboard fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   PARENT CHILD SUMMARY
========================================= */
export async function getParentChildSummaryHandler(
  req,
  res,
  next
) {
  try {
    const data =
      await getParentChildSummary(
        req.user
      );

    return res.json({
      success: true,
      message:
        "Parent child summary fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   TEACHER DASHBOARD
========================================= */
export async function getTeacherDashboardHandler(
  req,
  res,
  next
) {
  try {
    const data =
      await getTeacherDashboard(
        req.user
      );

    return res.json({
      success: true,
      message:
        "Teacher dashboard fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}