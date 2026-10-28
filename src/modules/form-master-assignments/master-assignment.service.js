import mongoose from "mongoose";

import { FormMasterAssignment } from "./form-master-assignment.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { User } from "../users/user.model.js";
import { ClassModel } from "../classes/class.model.js";
import { Session } from "../sessions/session.model.js";
import { ApiError } from "../../utils/apiError.js";

async function validateAssignment({
  schoolId,
  sessionId,
  classId,
  teacherId,
}) {
  if (
    !mongoose.isValidObjectId(schoolId) ||
    !mongoose.isValidObjectId(sessionId) ||
    !mongoose.isValidObjectId(classId) ||
    !mongoose.isValidObjectId(teacherId)
  ) {
    throw new ApiError(400, "Invalid assignment ID.");
  }

  const [session, schoolClass, teacher] = await Promise.all([
    Session.findOne({ _id: sessionId, schoolId }),
    ClassModel.findOne({
      _id: classId,
      schoolId,
      isActive: true,
    }),
    Teacher.findOne({
      _id: teacherId,
      schoolId,
      status: "active",
    }).populate("userId", "firstName lastName email role isActive"),
  ]);

  if (!session) {
    throw new ApiError(
      404,
      "Academic session not found in this school."
    );
  }

  if (!schoolClass) {
    throw new ApiError(
      404,
      "Active class not found in this school."
    );
  }

  if (!teacher || !teacher.userId) {
    throw new ApiError(
      404,
      "Active teacher not found in this school."
    );
  }

  if (
    teacher.userId.role !== "teacher" ||
    teacher.userId.isActive !== true
  ) {
    throw new ApiError(
      400,
      "The selected teacher's account is inactive or invalid."
    );
  }

  return { session, schoolClass, teacher };
}

function populateAssignment(query) {
  return query
    .populate("sessionId", "name")
    .populate("classId", "name level code")
    .populate({
      path: "teacherId",
      select: "employeeId designation status",
      populate: {
        path: "userId",
        select: "firstName lastName email",
      },
    })
    .populate("assignedBy", "firstName lastName")
    .populate("history.teacherId", "employeeId")
    .populate("history.teacherUserId", "firstName lastName")
    .populate("history.changedBy", "firstName lastName");
}

export async function listFormMasterAssignments(
  schoolId,
  sessionId
) {
  const filter = { schoolId };

  if (sessionId) {
    if (!mongoose.isValidObjectId(sessionId)) {
      throw new ApiError(400, "Invalid academic session ID.");
    }

    filter.sessionId = sessionId;
  }

  return populateAssignment(
    FormMasterAssignment.find(filter).sort({ updatedAt: -1 })
  );
}

export async function createFormMasterAssignment(
  payload,
  schoolId,
  userId
) {
  const { session, schoolClass, teacher } =
    await validateAssignment({
      schoolId,
      sessionId: payload.sessionId,
      classId: payload.classId,
      teacherId: payload.teacherId,
    });

  const existing = await FormMasterAssignment.findOne({
    schoolId,
    sessionId: session._id,
    classId: schoolClass._id,
  });

  if (existing) {
    throw new ApiError(
      409,
      "This class already has a Form Master for the selected session. Use reassign to change the teacher."
    );
  }

  try {
    const assignment = await FormMasterAssignment.create({
      schoolId,
      sessionId: session._id,
      classId: schoolClass._id,
      teacherId: teacher._id,
      teacherUserId: teacher.userId._id,
      assignedBy: userId,
    });

    return populateAssignment(
      FormMasterAssignment.findById(assignment._id)
    );
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(
        409,
        "A Form Master has already been assigned to this class and session."
      );
    }

    throw error;
  }
}

export async function reassignFormMaster(
  assignmentId,
  teacherId,
  schoolId,
  userId
) {
  if (
    !mongoose.isValidObjectId(assignmentId) ||
    !mongoose.isValidObjectId(teacherId)
  ) {
    throw new ApiError(400, "Invalid assignment or teacher ID.");
  }

  const assignment = await FormMasterAssignment.findOne({
    _id: assignmentId,
    schoolId,
  });

  if (!assignment) {
    throw new ApiError(404, "Form Master assignment not found.");
  }

  const { teacher } = await validateAssignment({
    schoolId,
    sessionId: assignment.sessionId.toString(),
    classId: assignment.classId.toString(),
    teacherId,
  });

  if (assignment.teacherId.toString() === teacher._id.toString()) {
    throw new ApiError(
      400,
      "This teacher is already assigned to the selected class."
    );
  }

  assignment.history.push({
    teacherId: assignment.teacherId,
    teacherUserId: assignment.teacherUserId,
    changedBy: userId,
    changedAt: new Date(),
  });

  assignment.teacherId = teacher._id;
  assignment.teacherUserId = teacher.userId._id;
  assignment.assignedBy = userId;
  assignment.assignedAt = new Date();

  await assignment.save();

  return populateAssignment(
    FormMasterAssignment.findById(assignment._id)
  );
}
