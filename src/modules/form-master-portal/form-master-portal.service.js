import mongoose from "mongoose";

import { Teacher } from "../teachers/teacher.model.js";
import { Student } from "../students/student.model.js";
import { Session } from "../sessions/session.model.js";
import { FormMasterAssignment } from
  "../form-master-assignments/form-master-assignment.model.js";
import { ApiError } from "../../utils/apiError.js";

async function getActiveTeacher(userId) {
  const teacher = await Teacher.findOne({
    userId,
    status: "active",
  })
    .populate("userId", "firstName lastName email isActive")
    .lean();

  if (!teacher || !teacher.userId) {
    throw new ApiError(404, "Active teacher profile not found.");
  }

  if (teacher.userId.isActive !== true) {
    throw new ApiError(403, "Your teacher account is inactive.");
  }

  return teacher;
}

async function getSession(schoolId, sessionId) {
  if (sessionId) {
    if (!mongoose.isValidObjectId(sessionId)) {
      throw new ApiError(400, "Invalid academic session ID.");
    }

    const session = await Session.findOne({
      _id: sessionId,
      schoolId,
    }).lean();

    if (!session) {
      throw new ApiError(
        404,
        "Academic session not found in your school."
      );
    }

    return session;
  }

  return Session.findOne({
    schoolId,
    isCurrent: true,
  }).lean();
}

export async function getFormMasterOverview(userId, sessionId) {
  const teacher = await getActiveTeacher(userId);

  const session = await getSession(teacher.schoolId, sessionId);

  if (!session) {
    return {
      teacher: {
        firstName: teacher.userId.firstName || "",
        lastName: teacher.userId.lastName || "",
        email: teacher.userId.email || "",
      },
      session: null,
      stats: {
        assignedClasses: 0,
        totalStudents: 0,
      },
      classes: [],
    };
  }

  const assignments = await FormMasterAssignment.find({
    schoolId: teacher.schoolId,
    sessionId: session._id,
    teacherId: teacher._id,
    teacherUserId: teacher.userId._id,
  })
    .populate("classId", "name level code isActive")
    .sort({ createdAt: -1 })
    .lean();

  const validAssignments = assignments.filter(
    (assignment) =>
      assignment.classId &&
      assignment.classId.isActive !== false
  );

  const classes = await Promise.all(
    validAssignments.map(async (assignment) => {
      const studentCount = await Student.countDocuments({
        schoolId: teacher.schoolId,
        classId: assignment.classId._id,
      });

      return {
        assignmentId: assignment._id,
        classId: assignment.classId._id,
        name: assignment.classId.name,
        level: assignment.classId.level || "",
        code: assignment.classId.code || "",
        studentCount,
        assignedAt: assignment.assignedAt,
      };
    })
  );

  return {
    teacher: {
      id: teacher._id,
      firstName: teacher.userId.firstName || "",
      lastName: teacher.userId.lastName || "",
      email: teacher.userId.email || "",
    },
    session: {
      _id: session._id,
      name: session.name,
      isCurrent: session.isCurrent,
    },
    stats: {
      assignedClasses: classes.length,
      totalStudents: classes.reduce(
        (total, item) => total + item.studentCount,
        0
      ),
    },
    classes,
  };
}

export async function getFormMasterClassStudents(
  userId,
  classId,
  sessionId
) {
  const teacher = await getActiveTeacher(userId);

  if (!mongoose.isValidObjectId(classId)) {
    throw new ApiError(400, "Invalid class ID.");
  }

  const session = await getSession(teacher.schoolId, sessionId);

  if (!session) {
    throw new ApiError(404, "No current academic session was found.");
  }

  const assignment = await FormMasterAssignment.findOne({
    schoolId: teacher.schoolId,
    sessionId: session._id,
    classId,
    teacherId: teacher._id,
    teacherUserId: teacher.userId._id,
  }).lean();

  if (!assignment) {
    throw new ApiError(
      403,
      "You are not the Form Master of this class for the selected session."
    );
  }

  const students = await Student.find({
    schoolId: teacher.schoolId,
    classId,
  })
    .select("firstName lastName admissionNumber gender")
    .sort({ firstName: 1, lastName: 1 })
    .lean();

  return {
    session: {
      _id: session._id,
      name: session.name,
    },
    students: students.map((student) => ({
      _id: student._id,
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      fullName:
        `${student.firstName || ""} ${student.lastName || ""}`.trim(),
      admissionNumber: student.admissionNumber || "",
      gender: student.gender || "",
    })),
  };
      }
