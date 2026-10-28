import {
  getFormMasterOverview,
  getFormMasterClassStudents,
} from "./form-master-portal.service.js";

export async function getFormMasterOverviewHandler(req, res) {
  const data = await getFormMasterOverview(
    req.user.id,
    req.query.sessionId
  );

  return res.status(200).json({
    success: true,
    message: "Form Master dashboard loaded successfully.",
    data,
  });
}

export async function getFormMasterClassStudentsHandler(req, res) {
  const data = await getFormMasterClassStudents(
    req.user.id,
    req.params.classId,
    req.query.sessionId
  );

  return res.status(200).json({
    success: true,
    message: "Assigned class students fetched successfully.",
    data,
  });
}
