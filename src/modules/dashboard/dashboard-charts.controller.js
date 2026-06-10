import {
  getParentCharts,
  getParentChildCharts,
  getSchoolAdminCharts,
  getSuperAdminCharts,
  getTeacherCharts,
} from "./dashboard-charts.service.js";

export async function superAdminChartsHandler(req, res) {
  const data = await getSuperAdminCharts(req.user);

  res.json({
    success: true,
    message: "Super admin charts fetched successfully",
    data,
  });
}

export async function schoolAdminChartsHandler(req, res) {
  const data = await getSchoolAdminCharts(req.user);

  res.json({
    success: true,
    message: "School admin charts fetched successfully",
    data,
  });
}

export async function teacherChartsHandler(req, res) {
  const data = await getTeacherCharts(req.user);

  res.json({
    success: true,
    message: "Teacher charts fetched successfully",
    data,
  });
}

export async function parentChartsHandler(req, res) {
  const data = await getParentCharts(req.user);

  res.json({
    success: true,
    message: "Parent charts fetched successfully",
    data,
  });
}

export async function parentChildChartsHandler(req, res) {
  const data = await getParentChildCharts(req.user, req.params.studentId);

  res.json({
    success: true,
    message: "Parent child charts fetched successfully",
    data,
  });
}