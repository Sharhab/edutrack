// modules/attendance/attendance.service.js

import { Attendance } from "./attendance.model.js";
import { ClassModel } from "../classes/class.model.js";
import { Student } from "../students/student.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { ensureParentOwnsStudent } from "../parents/parent.guard.js";
import { ApiError } from "../../utils/apiError.js";

// ================= HELPERS =================

async function validateAcademicRefs({
  classId,
  sessionId,
  termId,
  schoolId,
}) {
  const classDoc = await ClassModel.findOne({
    _id: classId,
    schoolId,
  });

  if (!classDoc) {
    throw new ApiError(400, "Invalid class");
  }

  const sessionDoc = await Session.findOne({
    _id: sessionId,
    schoolId,
  });

  if (!sessionDoc) {
    throw new ApiError(400, "Invalid session");
  }

  const termDoc = await Term.findOne({
    _id: termId,
    schoolId,
  });

  if (!termDoc) {
    throw new ApiError(400, "Invalid term");
  }
}

async function validateStudents(records, classId, schoolId) {
  const studentIds = records.map((r) => r.studentId);

  const count = await Student.countDocuments({
    _id: { $in: studentIds },
    schoolId,
    classId,
  });

  if (count !== studentIds.length) {
    throw new ApiError(
      400,
      "One or more students are invalid for this class"
    );
  }
}

async function ensureTeacherCanMark({
  userId,
  role,
  classId,
  schoolId,
}) {
  if (role === "school_admin") {
    return;
  }

  if (role !== "teacher") {
    throw new ApiError(
      403,
      "Only school admin or teacher can mark attendance"
    );
  }

  const teacher = await Teacher.findOne({
    userId,
    schoolId,
  });

  if (!teacher) {
    throw new ApiError(403, "Teacher profile not found");
  }

  const allowed = teacher.classIds.some(
    (id) => id.toString() === classId.toString()
  );

  if (!allowed) {
    throw new ApiError(
      403,
      "You are not assigned to this class"
    );
  }
}

// ================= FORMATTER =================

function formatAttendance(doc) {
  const teacherName = doc.markedBy
    ? `${doc.markedBy.firstName || ""} ${
        doc.markedBy.lastName || ""
      }`.trim()
    : "";

  return {
    _id: doc._id,

    studentId: doc.studentId?._id || "",
    studentName: doc.studentId
      ? `${doc.studentId.firstName || ""} ${
          doc.studentId.lastName || ""
        }`.trim()
      : "Unknown Student",

    classId: doc.classId?._id || "",
    className: doc.classId?.name || "",

    sessionId: doc.sessionId?._id || "",
    sessionName: doc.sessionId?.name || "",

    termId: doc.termId?._id || "",
    termName: doc.termId?.name || "",

    date: doc.date,
    status: doc.status,

    teacherName:
      teacherName || "Unknown Teacher",

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// ================= CREATE =================

export async function markAttendance(payload, user) {
  const schoolId = user.schoolId;

  await validateAcademicRefs({
    classId: payload.classId,
    sessionId: payload.sessionId,
    termId: payload.termId,
    schoolId,
  });

  await validateStudents(
    payload.records,
    payload.classId,
    schoolId
  );

  await ensureTeacherCanMark({
    userId: user._id,
    role: user.role,
    classId: payload.classId,
    schoolId,
  });

  

  const operations = payload.records.map((record) => ({
    updateOne: {
      filter: {
        schoolId,
        studentId: record.studentId,
        classId: payload.classId,
        date: payload.date,
      },
      update: {
        $set: {
          schoolId,
          studentId: record.studentId,
          classId: payload.classId,
          sessionId: payload.sessionId,
          termId: payload.termId,
          date: payload.date,
          status: record.status,
          markedBy: user._id,
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(operations);

  const attendance = await Attendance.find({
    schoolId,
    classId: payload.classId,
    date: payload.date,
  })
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("classId", "name level")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .populate("markedBy", "firstName lastName role")
    .sort({ createdAt: -1 });

  return attendance.map(formatAttendance);
}

// ================= LIST =================

export async function listAttendance(query, user) {
  const filter = {
    schoolId: user.schoolId,
  };

  if (query.classId) {
    filter.classId = query.classId;
  }

  if (query.studentId) {
    filter.studentId = query.studentId;
  }

  if (query.date) {
    filter.date = query.date;
  }

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({
      userId: user._id,
      schoolId: user.schoolId,
    });

    if (!teacher) {
      throw new ApiError(403, "Teacher profile not found");
    }

    filter.classId = {
      $in: teacher.classIds,
    };
  }

  if (user.role === "parent") {
    if (!query.studentId) {
      throw new ApiError(
        400,
        "Parent must provide a studentId"
      );
    }

    await ensureParentOwnsStudent(
      user,
      query.studentId
    );

    filter.studentId = query.studentId;
  }

  const attendance = await Attendance.find(filter)
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("classId", "name level")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .populate("markedBy", "firstName lastName role")
    .sort({ createdAt: -1 });

  return attendance.map(formatAttendance);
}

// ================= GET ONE =================

export async function getAttendanceById(id, user) {
  const attendance = await Attendance.findOne({
    _id: id,
    schoolId: user.schoolId,
  })
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("classId", "name level")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .populate("markedBy", "firstName lastName role");

  if (!attendance) {
    throw new ApiError(404, "Attendance not found");
  }

  return formatAttendance(attendance);
}

// ================= UPDATE =================

export async function updateAttendance(
  id,
  payload,
  user
) {
  const attendance = await Attendance.findOne({
    _id: id,
    schoolId: user.schoolId,
  });

  if (!attendance) {
    throw new ApiError(404, "Attendance not found");
  }

  await validateAcademicRefs({
    classId: payload.classId || attendance.classId,
    sessionId:
      payload.sessionId || attendance.sessionId,
    termId: payload.termId || attendance.termId,
    schoolId: user.schoolId,
  });

  await ensureTeacherCanMark({
    userId: user._id,
    role: user.role,
    classId: (
      payload.classId || attendance.classId
    ).toString(),
    schoolId: user.schoolId,
  });

  Object.assign(attendance, {
    studentId:
      payload.studentId || attendance.studentId,
    classId: payload.classId || attendance.classId,
    sessionId:
      payload.sessionId || attendance.sessionId,
    termId: payload.termId || attendance.termId,
    date: payload.date || attendance.date,
    status: payload.status || attendance.status,
    markedBy: user._id,
  });

  await attendance.save();

  const populated = await Attendance.findById(
    attendance._id
  )
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("classId", "name level")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .populate("markedBy", "firstName lastName role");

  return formatAttendance(populated);
}

// ================= DELETE =================

export async function deleteAttendance(id, user) {
  const attendance = await Attendance.findOne({
    _id: id,
    schoolId: user.schoolId,
  });

  if (!attendance) {
    throw new ApiError(404, "Attendance not found");
  }

  if (user.role !== "school_admin") {
    throw new ApiError(
      403,
      "Only admin can delete attendance"
    );
  }

  await attendance.deleteOne();

  return true;
}

// ================= CLASS + DATE =================

export async function getAttendanceByClassAndDate(
  { classId, date },
  user
) {
  const filter = {
    schoolId: user.schoolId,
    classId,
    date,
  };

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({
      userId: user._id,
      schoolId: user.schoolId,
    });

    if (!teacher) {
      throw new ApiError(403, "Teacher profile not found");
    }

    const allowed = teacher.classIds.some(
      (id) => id.toString() === classId
    );

    if (!allowed) {
      throw new ApiError(
        403,
        "You are not assigned to this class"
      );
    }
  }

  if (user.role === "parent") {
    throw new ApiError(
      403,
      "Parents cannot view class attendance"
    );
  }

  const attendance = await Attendance.find(filter)
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("classId", "name level")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .populate("markedBy", "firstName lastName role")
    .sort({ createdAt: -1 });

  return attendance.map(formatAttendance);
}