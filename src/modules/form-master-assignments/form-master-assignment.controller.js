import {
  assignFormMasterSchema,
  reassignFormMasterSchema,
} from "./form-master-assignment.validation.js";

import {
  listFormMasterAssignments,
  createFormMasterAssignment,
  reassignFormMaster,
} from "./form-master-assignment.service.js";

function getUserId(user) {
  return user?._id || user?.id;
}

export async function listFormMasterAssignmentsHandler(req, res) {
  const data = await listFormMasterAssignments(
    req.user.schoolId,
    req.query.sessionId
  );

  return res.status(200).json({
    success: true,
    message: "Form Master assignments fetched successfully.",
    data,
  });
}

export async function createFormMasterAssignmentHandler(req, res) {
  const payload = assignFormMasterSchema.parse(req.body);

  const data = await createFormMasterAssignment(
    payload,
    req.user.schoolId,
    getUserId(req.user)
  );

  return res.status(201).json({
    success: true,
    message: "Form Master assigned successfully.",
    data,
  });
}

export async function reassignFormMasterHandler(req, res) {
  const payload = reassignFormMasterSchema.parse(req.body);

  const data = await reassignFormMaster(
    req.params.id,
    payload.teacherId,
    req.user.schoolId,
    getUserId(req.user)
  );

  return res.status(200).json({
    success: true,
    message: "Form Master reassigned successfully.",
    data,
  });
}
