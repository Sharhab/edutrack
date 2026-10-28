
import { Attendance } from "./attendance.model.js";
import { ClassModel } from "../classes/class.model.js";
import { Student } from "../students/student.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { FormMasterAssignment } from "../form-master-assignments/form-master-assignment.model.js";
import { ensureParentOwnsStudent } from "../parents/parent.guard.js";
import { ApiError } from "../../utils/apiError.js";

// Validate class, session and term belong to the same school.
async function validateAcademicRefs({
  classId,
  sessionId,
  termId,
  schoolId,
}) {
  const [classDoc, sessionDoc, termDoc] = await Promise.all([
    ClassModel.findOne({ _id: classId, schoolId }),
    Session.findOne({ _id: sessionId, schoolId }),
    Term.findOne({ _id: termId, schoolId, sessionId }),
  ]);

  if (!classDoc) throw new ApiError(400, "Invalid class");
  if (!sessionDoc) throw new ApiError(400, "Invalid session");

  if (!termDoc) {
    throw new ApiError(
      400,
      "Invalid term or the term does not belong to the selected session"
    );
  }
}

async function validateStudents(records, classId, schoolId) {
  const studentIds = records.map((record) => record.studentId);

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

/**
 * Teachers may manage a class if:
 * 1. It is in their existing teacher.classIds, OR
 * 2. They are the Form Master assigned to that class for this session.
 */
async function ensureTeacherCanMark({
  userId,
  role,
  classId,
  sessionId,
  schoolId,
}) {
  if (role === "school_admin") return;

  if (role !== "teacher") {
    throw new ApiError(
      403,
      "Only school admin or teacher can manage attendance"
    );
  }

  const teacher = await Teacher.findOne({ userId, schoolId });

  if (!teacher) {
    throw new ApiError(403, "Teacher profile not found");
  }

  const existingClassIds = Array.isArray(teacher.classIds)
    ? teacher.classIds
    : [];

  const isExistingClassTeacher = existingClassIds.some(
    (id) => id.toString() === classId.toString()
  );

  if (isExistingClassTeacher) return;

  // Form Master permission must be scoped to the selected session.
  if (!sessionId) {
    throw new ApiError(
      403,
      "A session is required to verify Form Master assignment"
    );
  }

  const assignment = await FormMasterAssignment.findOne({
    schoolId,
    sessionId,
    classId,
    teacherId: teacher._id,
    teacherUserId: userId,
  }).select("_id");

  if (!assignment) {
    throw new ApiError(
      403,
      "You are not assigned to this class for the selected session"
    );
  }
}

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
    teacherName: teacherName || "Unknown Teacher",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function populateAttendance(query) {
  return query
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("classId", "name level")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .populate("markedBy", "firstName lastName role");
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

  await ensureTeacherCanMark({
    userId: user._id,
    role: user.role,
    classId: payload.classId,
    sessionId: payload.sessionId,
    schoolId,
  });

  await validateStudents(payload.records, payload.classId, schoolId);

  const operations = payload.records.map((record) => ({
    updateOne: {
      filter: {
        schoolId,
        studentId: record.studentId,
        classId: payload.classId,
        sessionId: payload.sessionId,
        termId: payload.termId,
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

  const attendance = await populateAttendance(
    Attendance.find({
      schoolId,
      classId: payload.classId,
      sessionId: payload.sessionId,
      termId: payload.termId,
      date: payload.date,
    }).sort({ createdAt: -1 })
  );

  return attendance.map(formatAttendance);
}

// ================= LIST =================

export async function listAttendance(query, user) {
  const filter = { schoolId: user.schoolId };

  if (query.classId) filter.classId = query.classId;
  if (query.studentId) filter.studentId = query.studentId;
  if (query.date) filter.date = query.date;
  if (query.sessionId) filter.sessionId = query.sessionId;
  if (query.termId) filter.termId = query.termId;

  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({
      userId: user._id,
      schoolId: user.schoolId,
    });

    if (!teacher) {
      throw new ApiError(403, "Teacher profile not found");
    }

    const assignments = await FormMasterAssignment.find({
      schoolId: user.schoolId,
      teacherId: teacher._id,
      teacherUserId: user._id,
      ...(query.sessionId ? { sessionId: query.sessionId } : {}),
      ...(query.classId ? { classId: query.classId } : {}),
    }).select("classId sessionId");

    const allowedPairs = assignments.map((item) => ({
      classId: item.classId,
      sessionId: item.sessionId,
    }));

    const accessConditions = [];

    if (teacher.classIds?.length) {
      accessConditions.push({
        classId: { $in: teacher.classIds },
      });
    }

    if (allowedPairs.length) {
      accessConditions.push(...allowedPairs);
    }

    if (!accessConditions.length) {
      return [];
    }

    filter.$or = accessConditions;
  }

  if (user.role === "parent") {
    if (!query.studentId) {
      throw new ApiError(400, "Parent must provide a studentId");
    }

    await ensureParentOwnsStudent(user, query.studentId);
    filter.studentId = query.studentId;
  }

  const attendance = await populateAttendance(
    Attendance.find(filter).sort({ createdAt: -1 })
  );

  return attendance.map(formatAttendance);
}

// ================= GET ONE =================

export async function getAttendanceById(id, user) {
  const attendance = await Attendance.findOne({
    _id: id,
    schoolId: user.schoolId,
  });

  if (!attendance) {
    throw new ApiError(404, "Attendance not found");
  }

  if (user.role === "teacher") {
    await ensureTeacherCanMark({
      userId: user._id,
      role: user.role,
      classId: attendance.classId,
      sessionId: attendance.sessionId,
      schoolId: user.schoolId,
    });
  }

  if (user.role === "parent") {
    await ensureParentOwnsStudent(user, attendance.studentId);
  }

  const populated = await populateAttendance(
    Attendance.findById(attendance._id)
  );

  return formatAttendance(populated);
}

// ================= UPDATE =================

export async function updateAttendance(id, payload, user) {
  const attendance = await Attendance.findOne({
    _id: id,
    schoolId: user.schoolId,
  });

  if (!attendance) {
    throw new ApiError(404, "Attendance not found");
  }

  const classId = payload.classId || attendance.classId;
  const sessionId = payload.sessionId || attendance.sessionId;
  const termId = payload.termId || attendance.termId;

  await validateAcademicRefs({
    classId,
    sessionId,
    termId,
    schoolId: user.schoolId,
  });

  await ensureTeacherCanMark({
    userId: user._id,
    role: user.role,
    classId,
    sessionId,
    schoolId: user.schoolId,
  });

  const studentId = payload.studentId || attendance.studentId;

  // Prevent moving an attendance record to a student outside the class.
  const student = await Student.findOne({
    _id: studentId,
    schoolId: user.schoolId,
    classId,
  });

  if (!student) {
    throw new ApiError(400, "Student is invalid for this class");
  }

  Object.assign(attendance, {
    studentId,
    classId,
    sessionId,
    termId,
    date: payload.date || attendance.date,
    status: payload.status || attendance.status,
    markedBy: user._id,
  });

  await attendance.save();

  const populated = await populateAttendance(
    Attendance.findById(attendance._id)
  );

  return formatAttendance(populated);
}

// ================= DELETE =================

export async function deleteAttendance(id, user) {
  if (user.role !== "school_admin") {
    throw new ApiError(403, "Only admin can delete attendance");
  }

  const attendance = await Attendance.findOne({
    _id: id,
    schoolId: user.schoolId,
  });

  if (!attendance) {
    throw new ApiError(404, "Attendance not found");
  }

  await attendance.deleteOne();
  return true;
}

// ================= CLASS + DATE =================

export async function getAttendanceByClassAndDate(
  { classId, date, sessionId },
  user
) {
  if (user.role === "parent") {
    throw new ApiError(403, "Parents cannot view class attendance");
  }

  if (user.role === "teacher") {
    await ensureTeacherCanMark({
      userId: user._id,
      role: user.role,
      classId,
      sessionId,
      schoolId: user.schoolId,
    });
  }

  const filter = {
    schoolId: user.schoolId,
    classId,
    date,
    ...(sessionId ? { sessionId } : {}),
  };

  const attendance = await populateAttendance(
    Attendance.find(filter).sort({ createdAt: -1 })
  );

  return attendance.map(formatAttendance);
      }
