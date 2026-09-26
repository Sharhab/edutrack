import { Teacher } from "../teachers/teacher.model.js";
import { Student } from "../students/student.model.js";
import { Announcement } from "../announcements/announcement.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ApiError } from "../../utils/apiError.js";

/* =========================================
   GET TEACHER PROFILE
========================================= */

async function getTeacherProfile(userId) {
  const teacher = await Teacher.findOne({ userId })
    .populate(
      "userId",
      "firstName lastName email"
    )
    .populate("classIds", "name")
    .lean();

  if (!teacher) {
    throw new ApiError(
      404,
      "Teacher not found"
    );
  }

  return teacher;
}

/* =========================================
   TEACHER PORTAL OVERVIEW
========================================= */

export async function getTeacherPortalOverview(
  userId
) {
  const teacher = await Teacher.findOne({
    userId,
    status: "active",
  })
    .populate({
      path: "userId",
      select: "firstName lastName email",
    })
    .populate({
      path: "classIds",
      select: "name",
    })
    .lean();

  if (!teacher) {
    throw new ApiError(
      404,
      "Teacher profile not found"
    );
  }

  const announcements =
    await Announcement.find({
      schoolId: teacher.schoolId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "title message createdAt"
      )
      .lean();

  return {
    teacher: {
      id: teacher._id,
      firstName:
        teacher.userId?.firstName || "",
      lastName:
        teacher.userId?.lastName || "",
      email:
        teacher.userId?.email || "",
    },

    classes: (
      teacher.classIds || []
    ).map((cls) => ({
      _id: cls._id,
      name:
        cls.name || "Unnamed Class",
    })),

    announcements:
      announcements || [],
  };
}

/* =========================================
   GET CLASS STUDENTS
========================================= */

export async function getTeacherClassStudents(
  userId,
  classId
) {
  const teacher = await Teacher.findOne({
    userId,
    status: "active",
  }).lean();

  if (!teacher) {
    throw new ApiError(
      404,
      "Teacher not found"
    );
  }

  const isAssigned = (
    teacher.classIds || []
  ).some(
    (id) =>
      String(id) === String(classId)
  );

  if (!isAssigned) {
    throw new ApiError(
      403,
      "You are not assigned to this class"
    );
  }

  const students =
    await Student.find({
      schoolId: teacher.schoolId,
      classId: classId,
    })
      .sort({
        firstName: 1,
        lastName: 1,
      })
      .select(
        "firstName lastName admissionNumber gender classId"
      )
      .lean();

  return {
    students: students.map(
      (student) => ({
        _id: student._id,
        firstName:
          student.firstName || "",
        lastName:
          student.lastName || "",
        fullName:
          `${student.firstName || ""} ${
            student.lastName || ""
          }`.trim(),
        admissionNumber:
          student.admissionNumber || "",
        gender:
          student.gender || "",
        attendanceStatus:
          "present",
      })
    ),
  };
}

/* =========================================
   SUBMIT ATTENDANCE
========================================= */

export async function submitTeacherAttendance(
  userId,
  payload
) {
  const {
    classId,
    sessionId,
    termId,
    attendance,
  } = payload;

  /* =========================================
     FIND ACTIVE TEACHER
  ========================================= */

  const teacher = await Teacher.findOne({
    userId,
    status: "active",
  }).lean();

  if (!teacher) {
    throw new ApiError(
      404,
      "Teacher not found"
    );
  }

  /* =========================================
     CHECK CLASS ASSIGNMENT
  ========================================= */

  const isAssigned = (
    teacher.classIds || []
  ).some(
    (id) =>
      String(id) === String(classId)
  );

  if (!isAssigned) {
    throw new ApiError(
      403,
      "You are not assigned to this class"
    );
  }

  /* =========================================
     VALIDATE SESSION
  ========================================= */

  if (!sessionId) {
    throw new ApiError(
      400,
      "Academic session is required"
    );
  }

  /* =========================================
     VALIDATE TERM
  ========================================= */

  if (!termId) {
    throw new ApiError(
      400,
      "Academic term is required"
    );
  }

  /* =========================================
     VERIFY SESSION BELONGS TO SCHOOL
  ========================================= */

  const session = await Session.findOne({
    _id: sessionId,
    schoolId: teacher.schoolId,
  }).lean();

  if (!session) {
    throw new ApiError(
      400,
      "Invalid academic session"
    );
  }

  /* =========================================
     VERIFY TERM BELONGS TO SCHOOL
  ========================================= */

  const term = await Term.findOne({
    _id: termId,
    schoolId: teacher.schoolId,
  }).lean();

  if (!term) {
    throw new ApiError(
      400,
      "Invalid academic term"
    );
  }

  /* =========================================
     VALIDATE ATTENDANCE DATA
  ========================================= */

  if (!Array.isArray(attendance)) {
    throw new ApiError(
      400,
      "Attendance data required"
    );
  }

  if (attendance.length === 0) {
    throw new ApiError(
      400,
      "Attendance data cannot be empty"
    );
  }

  /* =========================================
     TODAY
  ========================================= */

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  /* =========================================
     SAVE ATTENDANCE
  ========================================= */

  for (const item of attendance) {
    await Attendance.findOneAndUpdate(
      {
        schoolId:
          teacher.schoolId,

        classId,

        studentId:
          item.studentId,

        sessionId,

        termId,

        date: today,
      },

      {
        schoolId:
          teacher.schoolId,

        classId,

        studentId:
          item.studentId,

        sessionId,

        termId,

        status:
          item.status || "present",

        markedBy:
          teacher.userId,
      },

      {
        upsert: true,
        new: true,
      }
    );
  }

  /* =========================================
     RESPONSE
  ========================================= */

  return {
    success: true,
    message:
      "Attendance submitted successfully",
  };
}