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
   HELPERS
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

/**
 * Normalize attendance status.
 *
 * Supports existing values such as:
 * present
 * absent
 * late
 *
 * Also handles capitalized values safely.
 */
function normalizeAttendanceStatus(status) {
  return String(status || "").trim().toLowerCase();
}

/**
 * Build report-card attendance summary.
 */
function buildAttendanceSummary(records = []) {
  const present = records.filter(
    (x) => normalizeAttendanceStatus(x.status) === "present"
  ).length;

  const absent = records.filter(
    (x) => normalizeAttendanceStatus(x.status) === "absent"
  ).length;

  const late = records.filter(
    (x) => normalizeAttendanceStatus(x.status) === "late"
  ).length;

  const total = records.length;

  const percentage =
    total > 0
      ? Math.round((present / total) * 100)
      : 0;

  return {
    total,
    present,
    absent,
    late,
    percentage,
  };
}

/**
 * Get attendance for a student and selected term.
 *
 * First tries the exact academic relationship:
 * school + student + session + term
 *
 * If that produces no records, and the Term has dates,
 * it falls back to:
 * school + student + attendance date inside term dates.
 *
 * This is important for existing attendance records that
 * may not have sessionId/termId populated correctly.
 */
async function getReportCardAttendance({
  schoolId,
  studentId,
  studentClassId,
  sessionId,
  term,
}) {
  const baseQuery = {
    schoolId,
    studentId,
  };

  /*
   * =========================================
   * 1. EXACT ACADEMIC MATCH
   * =========================================
   */

  let exactRecords = [];

  try {
    exactRecords = await Attendance.find({
      ...baseQuery,
      sessionId,
      termId: term._id,
    }).sort({ date: 1, createdAt: 1 });
  } catch (error) {
    console.error(
      "REPORT CARD ATTENDANCE EXACT QUERY ERROR:",
      error.message
    );
  }

  if (exactRecords.length > 0) {
    console.log("REPORT CARD ATTENDANCE:", {
      method: "exact-session-term",
      studentId: String(studentId),
      sessionId: String(sessionId),
      termId: String(term._id),
      records: exactRecords.length,
      statuses: exactRecords.map((x) => x.status),
    });

    return exactRecords;
  }

  /*
   * =========================================
   * 2. TERM DATE FALLBACK
   * =========================================
   *
   * This allows the report card to work with
   * attendance records created before termId/
   * sessionId was attached to Attendance.
   */

  if (term.startDate && term.endDate) {
    const startDate = new Date(term.startDate);
    const endDate = new Date(term.endDate);

    /*
     * Include the entire end date.
     */
    endDate.setHours(23, 59, 59, 999);

    const dateQueries = [
      {
        ...baseQuery,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      {
        ...baseQuery,
        attendanceDate: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    ];

    /*
     * Try `date` first.
     */
    try {
      const dateRecords = await Attendance.find(
        dateQueries[0]
      ).sort({ date: 1, createdAt: 1 });

      if (dateRecords.length > 0) {
        console.log("REPORT CARD ATTENDANCE:", {
          method: "term-date",
          studentId: String(studentId),
          termId: String(term._id),
          startDate,
          endDate,
          records: dateRecords.length,
          statuses: dateRecords.map((x) => x.status),
        });

        return dateRecords;
      }
    } catch (error) {
      console.log(
        "Attendance date fallback skipped:",
        error.message
      );
    }

    /*
     * Try attendanceDate if the schema uses that name.
     */
    try {
      const attendanceDateRecords =
        await Attendance.find(dateQueries[1]).sort({
          attendanceDate: 1,
          createdAt: 1,
        });

      if (attendanceDateRecords.length > 0) {
        console.log("REPORT CARD ATTENDANCE:", {
          method: "term-attendanceDate",
          studentId: String(studentId),
          termId: String(term._id),
          startDate,
          endDate,
          records: attendanceDateRecords.length,
          statuses: attendanceDateRecords.map(
            (x) => x.status
          ),
        });

        return attendanceDateRecords;
      }
    } catch (error) {
      console.log(
        "Attendance attendanceDate fallback skipped:",
        error.message
      );
    }
  }

  /*
   * =========================================
   * 3. LAST FALLBACK
   * =========================================
   *
   * If existing attendance has neither correct
   * academic IDs nor usable term dates, return
   * an empty result rather than accidentally
   * mixing attendance from another term.
   */

  console.warn("REPORT CARD ATTENDANCE NOT FOUND:", {
    studentId: String(studentId),
    classId: studentClassId
      ? String(studentClassId)
      : null,
    sessionId: String(sessionId),
    termId: String(term._id),
    termStartDate: term.startDate,
    termEndDate: term.endDate,
  });

  return [];
}

/* =========================================
   RANKING ENGINE
========================================= */

function computePosition(sortedStudents, targetStudentId) {
  const index = sortedStudents.findIndex(
    (s) =>
      String(s.studentId) ===
      String(targetStudentId)
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
  /*
   * =========================================
   * AUTH
   * =========================================
   */

  if (user.role === "parent") {
    await ensureParentOwnsStudent(
      user,
      studentId
    );
  }

  /*
   * =========================================
   * VALIDATE IDS
   * =========================================
   */

  if (
    !mongoose.Types.ObjectId.isValid(studentId)
  ) {
    throw new ApiError(
      400,
      "studentId is invalid"
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(sessionId)
  ) {
    throw new ApiError(
      400,
      "sessionId is invalid"
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(termId)
  ) {
    throw new ApiError(
      400,
      "termId is invalid"
    );
  }

  const schoolId = new mongoose.Types.ObjectId(
    user.schoolId
  );

  const studentObjectId =
    new mongoose.Types.ObjectId(studentId);

  const sessionObjectId =
    new mongoose.Types.ObjectId(sessionId);

  const termObjectId =
    new mongoose.Types.ObjectId(termId);

  /*
   * =========================================
   * STUDENT
   * =========================================
   */

  const student = await Student.findOne({
    _id: studentObjectId,
    schoolId,
  }).populate("classId", "name level");

  if (!student) {
    throw new ApiError(
      404,
      "Student not found"
    );
  }

  /*
   * =========================================
   * SESSION + TERM
   * =========================================
   */

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

  /*
   * =========================================
   * RESULTS
   * =========================================
   */

  const results = await Result.find({
    schoolId,
    studentId: studentObjectId,
    sessionId: sessionObjectId,
    termId: termObjectId,
  })
    .populate("subjectId", "name code")
    .sort({ createdAt: 1 });

  /*
   * =========================================
   * ATTENDANCE
   * =========================================
   */

  const attendanceRecords =
    await getReportCardAttendance({
      schoolId,
      studentId: studentObjectId,
      studentClassId: student.classId?._id,
      sessionId: sessionObjectId,
      term,
    });

  const attendance =
    buildAttendanceSummary(
      attendanceRecords
    );

  /*
   * =========================================
   * SCORES
   * =========================================
   */

  const totalScore = results.reduce(
    (sum, r) =>
      sum + Number(r.total || 0),
    0
  );

  const averageScore =
    calculateAverage(
      totalScore,
      results.length
    );

  /*
   * =========================================
   * CLASS RANKING
   * =========================================
   */

  const classmates = await Student.find({
    schoolId,
    classId: student.classId?._id,
    status: "active",
  }).select("_id");

  const classmateIds =
    classmates.map((s) => s._id);

  const classResults =
    await Result.find({
      schoolId,
      studentId: {
        $in: classmateIds,
      },
      sessionId: sessionObjectId,
      termId: termObjectId,
    }).select(
      "studentId total"
    );

  const map = new Map();

  classResults.forEach((r) => {
    const key = String(
      r.studentId
    );

    map.set(
      key,
      (map.get(key) || 0) +
        Number(r.total || 0)
    );
  });

  const ranked = classmateIds
    .map((id) => ({
      studentId: id,
      total:
        map.get(String(id)) || 0,
    }))
    .sort(
      (a, b) => b.total - a.total
    );

  const position = computePosition(
    ranked,
    studentObjectId
  );

  /*
   * =========================================
   * RESPONSE
   * =========================================
   */

  return {
    reportCard: {
      /*
       * SCHOOL INFORMATION
       *
       * These are returned when available.
       * The actual School model can be populated
       * later if your project stores these fields
       * differently.
       */
      school: {
        _id: schoolId,
      },

      /*
       * STUDENT
       */

      student: {
        _id: student._id,
        admissionNumber:
          student.admissionNumber || "",

        firstName:
          student.firstName || "",

        lastName:
          student.lastName || "",

        gender:
          student.gender || "",

        photo:
          student.photo || "",

        className:
          student.classId?.name || "",

        classLevel:
          student.classId?.level || "",
      },

      /*
       * SESSION
       */

      session: {
        _id: session._id,
        name: session.name,
      },

      /*
       * TERM
       */

      term: {
        _id: term._id,
        name: term.name,
        startDate:
          term.startDate || null,
        endDate:
          term.endDate || null,
      },

      /*
       * SUBJECT RESULTS
       */

      results: results.map((r) => ({
        subjectName:
          r.subjectId?.name || "",

        subjectCode:
          r.subjectId?.code || "",

        ca1:
          Number(r.ca1 || 0),

        ca2:
          Number(r.ca2 || 0),

        assignment:
          Number(r.assignment || 0),

        exam:
          Number(r.exam || 0),

        total:
          Number(r.total || 0),

        grade:
          r.grade || "",

        remark:
          r.remark || "",
      })),

      /*
       * SUMMARY
       */

      summary: {
        subjectsCount:
          results.length,

        totalScore,

        averageScore,

        position,

        positionLabel:
          ordinal(position),
      },

      /*
       * ATTENDANCE
       *
       * This is now guaranteed to contain
       * the complete report-card structure.
       */

      attendance: {
        total:
          attendance.total,

        present:
          attendance.present,

        absent:
          attendance.absent,

        late:
          attendance.late,

        percentage:
          attendance.percentage,
      },
    },
  };
}

/* =========================================
   CLASS REPORT ENGINE
========================================= */

export async function generateClassReportSheet({
  user,
  classId,
  sessionId,
  termId,
}) {
  /*
   * =========================================
   * AUTH
   * =========================================
   */

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

  /*
   * =========================================
   * VALIDATE IDS
   * =========================================
   */

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
    new mongoose.Types.ObjectId(
      classId
    );

  const sessionObjectId =
    new mongoose.Types.ObjectId(
      sessionId
    );

  const termObjectId =
    new mongoose.Types.ObjectId(
      termId
    );

  /*
   * =========================================
   * CLASS
   * =========================================
   */

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

  /*
   * =========================================
   * SESSION + TERM
   * =========================================
   */

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

  /*
   * =========================================
   * STUDENTS
   * =========================================
   */

  const students =
    await Student.find({
      schoolId,
      classId: classObjectId,
      status: "active",
    }).select(
      "_id firstName lastName admissionNumber"
    );

  /*
   * =========================================
   * RESULTS
   * =========================================
   */

  const studentIds =
    students.map((s) => s._id);

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

  /*
   * =========================================
   * DEBUG
   * =========================================
   */

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

  /*
   * =========================================
   * MAP
   * =========================================
   */

  const map = new Map();

  students.forEach((s) => {
    map.set(String(s._id), {
      studentId: s._id,

      admissionNumber:
        s.admissionNumber || "",

      firstName:
        s.firstName || "",

      lastName:
        s.lastName || "",

      subjects: [],

      totalScore: 0,

      subjectCount: 0,

      averageScore: 0,

      position: 0,

      positionLabel: "",
    });
  });

  /*
   * =========================================
   * GROUP RESULTS
   * =========================================
   */

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

      ca1:
        Number(r.ca1 || 0),

      ca2:
        Number(r.ca2 || 0),

      assignment:
        Number(r.assignment || 0),

      exam:
        Number(r.exam || 0),

      total:
        Number(r.total || 0),

      grade:
        r.grade || "",

      remark:
        r.remark || "",
    });

    row.totalScore +=
      Number(r.total || 0);

    row.subjectCount += 1;
  });

  /*
   * =========================================
   * AVERAGE
   * =========================================
   */

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

  /*
   * =========================================
   * RANKING
   * =========================================
   */

  const ranked =
    Array.from(map.values()).sort(
      (a, b) =>
        b.totalScore -
        a.totalScore
    );

  ranked.forEach((s, i) => {
    s.position = i + 1;

    s.positionLabel =
      ordinal(i + 1);
  });

  /*
   * =========================================
   * RESPONSE
   * =========================================
   */

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
 * =========================================
 * GENERATE ALL STUDENT REPORT CARDS
 * =========================================
 */

export async function generateClassReportCardsBundle({
  user,
  classId,
  sessionId,
  termId,
}) {
  /*
   * =========================================
   * AUTH
   * =========================================
   */

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

  /*
   * =========================================
   * VALIDATE IDS
   * =========================================
   */

  if (
    !mongoose.Types.ObjectId.isValid(
      classId
    ) ||
    !mongoose.Types.ObjectId.isValid(
      sessionId
    ) ||
    !mongoose.Types.ObjectId.isValid(
      termId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid class/session/term ID"
    );
  }

  const schoolId =
    new mongoose.Types.ObjectId(
      user.schoolId
    );

  const classObjectId =
    new mongoose.Types.ObjectId(
      classId
    );

  const sessionObjectId =
    new mongoose.Types.ObjectId(
      sessionId
    );

  const termObjectId =
    new mongoose.Types.ObjectId(
      termId
    );

  /*
   * =========================================
   * CLASS CHECK
   * =========================================
   */

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

  /*
   * =========================================
   * STUDENTS
   * =========================================
   */

  const students =
    await Student.find({
      schoolId,
      classId: classObjectId,
      status: "active",
    }).select(
      "_id firstName lastName admissionNumber"
    );

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

  /*
   * =========================================
   * GENERATE REPORTS
   * =========================================
   */

  const reports = [];

  for (const student of students) {
    try {
      const report =
        await generateStudentReportCard({
          user,
          studentId: student._id,
          sessionId:
            sessionObjectId,
          termId:
            termObjectId,
        });

      /*
       * IMPORTANT:
       * generateStudentReportCard returns:
       *
       * {
       *   reportCard: {...}
       * }
       *
       * So store the actual reportCard.
       */
      reports.push(
        report.reportCard
      );
    } catch (err) {
      console.error(
        `Failed report for student ${student._id}`,
        err.message
      );

      reports.push({
        student: {
          _id: student._id,

          firstName:
            student.firstName || "",

          lastName:
            student.lastName || "",

          admissionNumber:
            student.admissionNumber || "",
        },

        error: true,

        message:
          "Failed to generate report card",
      });
    }
  }

  /*
   * =========================================
   * CLASS POSITION
   * =========================================
   */

  const ranked =
    reports
      .filter((r) => !r.error)
      .sort(
        (a, b) =>
          (b.summary?.totalScore || 0) -
          (a.summary?.totalScore || 0)
      );

  ranked.forEach((r, i) => {
    if (r.summary) {
      r.summary.classPosition =
        i + 1;
    }
  });

  /*
   * =========================================
   * RESPONSE
   * =========================================
   */

  return {
    class: {
      _id: classDoc._id,
      name: classDoc.name,
      level: classDoc.level,
    },

    sessionId,

    termId,

    totalStudents:
      students.length,

    generatedAt:
      new Date(),

    reports,
  };
}
