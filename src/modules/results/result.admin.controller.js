import {
  getAdminResultsOverview,
  getClassPerformance,
  getAdminResultsDashboard,
} from "./admin.result.service.js";

/**
 * ADMIN OVERVIEW DASHBOARD
 */
export async function getAdminResultsOverviewHandler(req, res) {
  const data = await getAdminResultsOverview(req.user);

  res.json({
    success: true,
    message: "Admin result overview fetched successfully",
    data,
  });
}

/**
 * CLASS PERFORMANCE ANALYTICS
 */
export async function getClassPerformanceHandler(req, res) {
  const data = await getClassPerformance(req.user);

  res.json({
    success: true,
    message: "Class performance fetched successfully",
    data,
  });
}


export async function getAdminDashboardHandler(req, res) {
  const data = await getAdminResultsDashboard({
    schoolId: req.user.schoolId,
    sessionId: req.query.sessionId,
    termId: req.query.termId,
  });

  res.json({
    success: true,
    data,
  });
}