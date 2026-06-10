import mongoose from "mongoose";

import { Student } from "../students/student.model.js";
import { Result } from "../results/result.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ClassModel } from "../classes/class.model.js";
import { ensureParentOwnsStudent } from "../parents/parent.guard.js";
import { ApiError } from "../../utils/apiError.js";

/* =========================================
   HELPERS (CORE ENGINE UTILITIES)
========================================= */

function ordinal(n) {
  if (!n) return "";

  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;

  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function calculateAverage(total, count) {
  if (!count) return 0;
  return Number((total / count).toFixed(2));
}

function buildAttendanceSummary(records = []) {
  return {
    total: records.length,
    present: records.filter((x) => x.status === "present").length,
    absent: records.filter((x) => x.status === "absent").length,
    late: records.filter((x) => x.status === "late").length,
  };
}

/* =========================================
   RANKING ENGINE (GLOBAL)
========================================= */

function computePosition(sortedStudents, targetStudentId) {
  const index = sortedStudents.findIndex(
    (s) => String(s.studentId) === String(targetStudentId)
  );

  return index >= 0 ? index + 1 : null;
}

/* =========================================
   STUDENT REPORT CARD ENGINE
========================================= */

export async function generateStudentReportCard({
  user,
  studentId,
  sessionId,
  termId,
}) {
  if (user.role === "parent") {
    await ensureParentOwnsStudent(user, studentId);
  }

  const student = await Student.findOne({
    _id: studentId,
    schoolId: user.schoolId,
  }).populate("classId", "name level");

  if (!student) throw new ApiError(404, "Student not found");

  const [session, term] = await Promise.all([
    Session.findOne({ _id: sessionId, schoolId: user.schoolId }),
    Term.findOne({ _id: termId, schoolId: user.schoolId }),
  ]);

  if (!session) throw new ApiError(404, "Session not found");
  if (!term) throw new ApiError(404, "Term not found");

  const results = await Result.find({
    schoolId: user.schoolId,
    studentId,
    sessionId,
    termId,
  })
    .populate("subjectId", "name code")
    .sort({ createdAt: 1 });

  const attendanceRecords = await Attendance.find({
    schoolId: user.schoolId,
    studentId,
    sessionId,
    termId,
  });

  const attendance = buildAttendanceSummary(attendanceRecords);

  const totalScore = results.reduce(
    (sum, r) => sum + (r.total || 0),
    0
  );

  const averageScore = calculateAverage(totalScore, results.length);

  /* CLASS RANKING */

  const classmates = await Student.find({
    schoolId: user.schoolId,
    classId: student.classId._id,
    status: "active",
  }).select("_id");

  const classmateIds = classmates.map((s) => s._id);

  const classResults = await Result.find({
    schoolId: user.schoolId,
    studentId: { $in: classmateIds },
    sessionId,
    termId,
  }).select("studentId total");

  const map = new Map();

  classResults.forEach((r) => {
    const key = String(r.studentId);
    map.set(key, (map.get(key) || 0) + (r.total || 0));
  });

  const ranked = classmateIds.map((id) => ({
    studentId: id,
    total: map.get(String(id)) || 0,
  }));

  const position = computePosition(ranked, studentId);

  return {
    reportCard: {
      student: {
        _id: student._id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        className: student.classId?.name || "",
        classLevel: student.classId?.level || "",
      },

      session: { _id: session._id, name: session.name },
      term: { _id: term._id, name: term.name },

      results: results.map((r) => ({
        subjectName: r.subjectId?.name || "",
        subjectCode: r.subjectId?.code || "",
        ca1: r.ca1 || 0,
        ca2: r.ca2 || 0,
        assignment: r.assignment || 0,
        exam: r.exam || 0,
        total: r.total || 0,
        grade: r.grade || "",
        remark: r.remark || "",
      })),

      summary: {
        subjectsCount: results.length,
        totalScore,
        averageScore,
        position,
        positionLabel: ordinal(position),
      },

      attendance,
    },
  };
}

/* =========================================
   CLASS REPORT ENGINE (RANKED SHEET)
========================================= */
export async function generateClassReportSheet({
  user,
  classId,
  sessionId,
  termId,
}) {
  /* =========================
     AUTH
  ========================= */

  if (
    !["school_admin", "teacher"].includes(
      user.role
    )
  ) {
    throw new ApiError(
      403,
      "Unauthorized access"
    );
  }

  /* =========================
     VALIDATE IDS
  ========================= */

  if (
    !mongoose.Types.ObjectId.isValid(
      classId
    )
  ) {
    throw new ApiError(
      400,
      "classId is invalid"
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      sessionId
    )
  ) {
    throw new ApiError(
      400,
      "sessionId is invalid"
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      termId
    )
  ) {
    throw new ApiError(
      400,
      "termId is invalid"
    );
  }

  const schoolId =
    new mongoose.Types.ObjectId(
      user.schoolId
    );

  const classObjectId =
    new mongoose.Types.ObjectId(classId);

  const sessionObjectId =
    new mongoose.Types.ObjectId(sessionId);

  const termObjectId =
    new mongoose.Types.ObjectId(termId);

  /* =========================
     CLASS
  ========================= */

  const classDoc =
    await ClassModel.findOne({
      _id: classObjectId,
      schoolId,
    });

  if (!classDoc) {
    throw new ApiError(
      404,
      "Class not found"
    );
  }

  /* =========================
     SESSION + TERM
  ========================= */

  const [session, term] =
    await Promise.all([
      Session.findOne({
        _id: sessionObjectId,
        schoolId,
      }),

      Term.findOne({
        _id: termObjectId,
        schoolId,
      }),
    ]);

  if (!session) {
    throw new ApiError(
      404,
      "Session not found"
    );
  }

  if (!term) {
    throw new ApiError(
      404,
      "Term not found"
    );
  }

  /* =========================
     STUDENTS
  ========================= */

  const students =
    await Student.find({
      schoolId,
      classId: classObjectId,
      status: "active",
    }).select(
      "_id firstName lastName admissionNumber"
    );

  const studentIds = students.map(
    (s) => s._id
  );

  /* =========================
     RESULTS
  ========================= */

  const results =
    await Result.find({
      schoolId,
      classId: classObjectId,
      sessionId: sessionObjectId,
      termId: termObjectId,
      studentId: {
        $in: studentIds,
      },
    }).populate(
      "subjectId",
      "name code"
    );

  console.log(
    "CLASS REPORT DEBUG"
  );

  console.log({
    classId,
    sessionId,
    termId,
    totalStudents:
      students.length,
    totalResults:
      results.length,
  });

  /* =========================
     MAP
  ========================= */

  const map = new Map();

  students.forEach((s) => {
    map.set(String(s._id), {
      studentId: s._id,
      admissionNumber:
        s.admissionNumber,
      firstName: s.firstName,
      lastName: s.lastName,

      subjects: [],

      totalScore: 0,

      subjectCount: 0,

      averageScore: 0,

      position: 0,

      positionLabel: "",
    });
  });

  /* =========================
     GROUP RESULTS
  ========================= */

  results.forEach((r) => {
    const row = map.get(
      String(r.studentId)
    );

    if (!row) return;

    row.subjects.push({
      subjectName:
        r.subjectId?.name || "",

      subjectCode:
        r.subjectId?.code || "",

      ca1: r.ca1 || 0,

      ca2: r.ca2 || 0,

      assignment:
        r.assignment || 0,

      exam: r.exam || 0,

      total: r.total || 0,

      grade: r.grade || "",

      remark: r.remark || "",
    });

    row.totalScore +=
      r.total || 0;

    row.subjectCount += 1;
  });

  /* =========================
     AVERAGE
  ========================= */

  map.forEach((row) => {
    row.averageScore =
      row.subjectCount > 0
        ? Number(
            (
              row.totalScore /
              row.subjectCount
            ).toFixed(2)
          )
        : 0;
  });

  /* =========================
     RANKING
  ========================= */

  const ranked = Array.from(
    map.values()
  ).sort(
    (a, b) =>
      b.totalScore -
      a.totalScore
  );

  ranked.forEach((s, i) => {
    s.position = i + 1;

    s.positionLabel = ordinal(
      i + 1
    );
  });

  /* =========================
     RESPONSE
  ========================= */

  return {
    classReport: {
      class: {
        _id: classDoc._id,
        name: classDoc.name,
        level: classDoc.level,
      },

      session: {
        _id: session._id,
        name: session.name,
      },

      term: {
        _id: term._id,
        name: term.name,
      },

      totalStudents:
        ranked.length,

      students: ranked,
    },
  };
}


/**
 * Generate ALL student report cards in a class
 */
export async function generateClassReportCardsBundle({
  user,
  classId,
  sessionId,
  termId,
}) {
  /* =========================
     AUTH
  ========================= */
  if (!["school_admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "Unauthorized access");
  }

  /* =========================
     VALIDATE IDS
  ========================= */
  if (
    !mongoose.Types.ObjectId.isValid(classId) ||
    !mongoose.Types.ObjectId.isValid(sessionId) ||
    !mongoose.Types.ObjectId.isValid(termId)
  ) {
    throw new ApiError(400, "Invalid class/session/term ID");
  }

  const schoolId = new mongoose.Types.ObjectId(user.schoolId);
  const classObjectId = new mongoose.Types.ObjectId(classId);

  /* =========================
     CLASS CHECK
  ========================= */
  const classDoc = await ClassModel.findOne({
    _id: classObjectId,
    schoolId,
  });

  if (!classDoc) {
    throw new ApiError(404, "Class not found");
  }

  /* =========================
     GET STUDENTS
  ========================= */
  const students = await Student.find({
    schoolId,
    classId: classObjectId,
    status: "active",
  }).select("_id firstName lastName admissionNumber");

  if (!students.length) {
    return {
      class: {
        _id: classDoc._id,
        name: classDoc.name,
        level: classDoc.level,
      },
      sessionId,
      termId,
      totalStudents: 0,
      reports: [],
    };
  }

  /* =========================
     GENERATE REPORTS
  ========================= */

  const reports = [];

  for (const student of students) {
    try {
      const report = await generateStudentReportCard({
        user,
        studentId: student._id,
        sessionId,
        termId,
      });

      reports.push(report);
    } catch (err) {
      // IMPORTANT: do not fail whole batch if one student fails
      console.error(
        `Failed report for student ${student._id}`,
        err.message
      );

      reports.push({
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNumber: student.admissionNumber,
        },
        error: true,
        message: "Failed to generate report card",
      });
    }
  }

  /* =========================
     OPTIONAL: CLASS RANKING SUMMARY
  ========================= */

  const ranked = reports
    .filter((r) => !r.error)
    .sort(
      (a, b) =>
        (b.summary?.totalScore || 0) -
        (a.summary?.totalScore || 0)
    );

  ranked.forEach((r, i) => {
    if (r.summary) {
      r.summary.classPosition = i + 1;
    }
  });

  /* =========================
     RESPONSE
  ========================= */

  return {
    class: {
      _id: classDoc._id,
      name: classDoc.name,
      level: classDoc.level,
    },

    sessionId,
    termId,

    totalStudents: students.length,

    generatedAt: new Date(),

    reports,
  };
}