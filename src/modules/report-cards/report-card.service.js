// modules/report-card/report-card.service.js

import mongoose from "mongoose";

import { Student } from "../students/student.model.js";
import { Result } from "../results/result.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ClassModel } from "../classes/class.model.js";

import { ensureParentOwnsStudent } from "../parents/parent.guard.js";
import { ApiError } from "../../utils/apiError.js";

/* =========================================================
   HELPERS
========================================================= */

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

/* =========================================================
   ATTENDANCE SUMMARY
========================================================= */

function buildAttendanceSummary(records = []) {
  const present = records.filter(
    (x) => x.status === "present"
  ).length;

  const absent = records.filter(
    (x) => x.status === "absent"
  ).length;

  const late = records.filter(
    (x) => x.status === "late"
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

/* =========================================================
   RANKING
========================================================= */

function computePosition(
  sortedStudents,
  targetStudentId
) {
  const index = sortedStudents.findIndex(
    (s) =>
      String(s.studentId) ===
      String(targetStudentId)
  );

  return index >= 0 ? index + 1 : null;
}

/* =========================================================
   GET STUDENT ATTENDANCE
========================================================= */

/**
 * IMPORTANT
 *
 * Attendance is stored with:
 *
 * schoolId
 * studentId
 * classId
 * sessionId
 * termId
 * date
 * status
 *
 * Therefore report cards should use the same
 * academic references instead of relying on
 * Term.startDate / Term.endDate.
 */
async function getReportCardAttendance({
  schoolId,
  studentId,
  classId,
  sessionId,
  termId,
}) {
  /* -------------------------------------------------------
     EXACT ATTENDANCE QUERY
  ------------------------------------------------------- */

  const attendanceRecords =
    await Attendance.find({
      schoolId,
      studentId,
      classId,
      sessionId,
      termId,
    })
      .select(
        "_id studentId classId sessionId termId date status"
      )
      .sort({
        date: 1,
        createdAt: 1,
      })
      .lean();

  /* -------------------------------------------------------
     DEBUG
  ------------------------------------------------------- */

  console.log(
    "REPORT CARD ATTENDANCE DEBUG",
    {
      studentId: String(studentId),
      classId: String(classId),
      sessionId: String(sessionId),
      termId: String(termId),

      attendanceCount:
        attendanceRecords.length,

      attendance:
        attendanceRecords.map((record) => ({
          _id: String(record._id),
          studentId:
            record.studentId
              ? String(record.studentId)
              : null,
          classId:
            record.classId
              ? String(record.classId)
              : null,
          sessionId:
            record.sessionId
              ? String(record.sessionId)
              : null,
          termId:
            record.termId
              ? String(record.termId)
              : null,
          date: record.date,
          status: record.status,
        })),
    }
  );

  /* -------------------------------------------------------
     IF FOUND
  ------------------------------------------------------- */

  if (attendanceRecords.length > 0) {
    const summary =
      buildAttendanceSummary(
        attendanceRecords
      );

    console.log(
      "REPORT CARD ATTENDANCE SUMMARY",
      summary
    );

    return summary;
  }

  /* -------------------------------------------------------
     DIAGNOSTIC:
     CHECK ALL ATTENDANCE FOR THIS STUDENT
     
     This does NOT use the result.
     It only helps us identify mismatched academic IDs.
  ------------------------------------------------------- */

  const allStudentAttendance =
    await Attendance.find({
      schoolId,
      studentId,
    })
      .select(
        "_id studentId classId sessionId termId date status"
      )
      .sort({
        date: 1,
        createdAt: 1,
      })
      .lean();

  console.log(
    "ALL STUDENT ATTENDANCE DEBUG",
    {
      studentId: String(studentId),

      totalRecords:
        allStudentAttendance.length,

      attendance:
        allStudentAttendance.map((record) => ({
          _id: String(record._id),

          studentId:
            record.studentId
              ? String(record.studentId)
              : null,

          classId:
            record.classId
              ? String(record.classId)
              : null,

          sessionId:
            record.sessionId
              ? String(record.sessionId)
              : null,

          termId:
            record.termId
              ? String(record.termId)
              : null,

          date: record.date,
          status: record.status,
        })),
    }
  );

  /* -------------------------------------------------------
     NOT FOUND
  ------------------------------------------------------- */

  console.log(
    "REPORT CARD ATTENDANCE NOT FOUND:",
    {
      studentId: String(studentId),
      classId: String(classId),
      sessionId: String(sessionId),
      termId: String(termId),

      totalStudentAttendance:
        allStudentAttendance.length,
    }
  );

  return {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0,
  };
}

/* =========================================================
   STUDENT REPORT CARD
========================================================= */

export async function generateStudentReportCard({
  user,
  studentId,
  sessionId,
  termId,
}) {
  /* -------------------------------------------------------
     PARENT AUTHORIZATION
  ------------------------------------------------------- */

  if (user.role === "parent") {
    await ensureParentOwnsStudent(
      user,
      studentId
    );
  }

  /* -------------------------------------------------------
     VALIDATE IDS
  ------------------------------------------------------- */

  if (
    !mongoose.Types.ObjectId.isValid(
      studentId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid student ID"
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      sessionId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid session ID"
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      termId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid term ID"
    );
  }

  /* -------------------------------------------------------
     SCHOOL ID
  ------------------------------------------------------- */

  const schoolId =
    new mongoose.Types.ObjectId(
      user.schoolId
    );

  const studentObjectId =
    new mongoose.Types.ObjectId(
      studentId
    );

  const sessionObjectId =
    new mongoose.Types.ObjectId(
      sessionId
    );

  const termObjectId =
    new mongoose.Types.ObjectId(
      termId
    );

  /* -------------------------------------------------------
     STUDENT
  ------------------------------------------------------- */

  const student =
    await Student.findOne({
      _id: studentObjectId,
      schoolId,
    }).populate(
      "classId",
      "name level"
    );

  if (!student) {
    throw new ApiError(
      404,
      "Student not found"
    );
  }

  if (!student.classId) {
    throw new ApiError(
      400,
      "Student is not assigned to a class"
    );
  }

  /* -------------------------------------------------------
     SESSION + TERM
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     RESULTS
  ------------------------------------------------------- */

  const results =
    await Result.find({
      schoolId,
      studentId: studentObjectId,
      sessionId: sessionObjectId,
      termId: termObjectId,
    })
      .populate(
        "subjectId",
        "name code"
      )
      .sort({
        createdAt: 1,
      });

  /* -------------------------------------------------------
     ATTENDANCE
  ------------------------------------------------------- */

  const attendance =
    await getReportCardAttendance({
      schoolId,
      studentId: studentObjectId,
      classId: student.classId._id,
      sessionId: sessionObjectId,
      termId: termObjectId,
    });

  /* -------------------------------------------------------
     SCORES
  ------------------------------------------------------- */

  const totalScore =
    results.reduce(
      (sum, result) =>
        sum + (result.total || 0),
      0
    );

  const averageScore =
    calculateAverage(
      totalScore,
      results.length
    );

  /* -------------------------------------------------------
     CLASSMATES
  ------------------------------------------------------- */

  const classmates =
    await Student.find({
      schoolId,
      classId: student.classId._id,
      status: "active",
    }).select("_id");

  const classmateIds =
    classmates.map(
      (s) => s._id
    );

  /* -------------------------------------------------------
     CLASS RESULTS
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     RANKING MAP
  ------------------------------------------------------- */

  const scoreMap = new Map();

  classResults.forEach(
    (result) => {
      const key =
        String(result.studentId);

      scoreMap.set(
        key,
        (scoreMap.get(key) || 0) +
          (result.total || 0)
      );
    }
  );

  const ranked =
    classmateIds
      .map((id) => ({
        studentId: id,
        total:
          scoreMap.get(
            String(id)
          ) || 0,
      }))
      .sort(
        (a, b) =>
          b.total - a.total
      );

  const position =
    computePosition(
      ranked,
      studentObjectId
    );

  /* -------------------------------------------------------
     FINAL RESPONSE
  ------------------------------------------------------- */

  return {
    reportCard: {
      student: {
        _id: student._id,

        admissionNumber:
          student.admissionNumber,

        firstName:
          student.firstName,

        lastName:
          student.lastName,

        gender:
          student.gender,

        photo:
          student.photo || "",

        className:
          student.classId?.name || "",

        classLevel:
          student.classId?.level || "",
      },

      session: {
        _id: session._id,
        name: session.name,
      },

      term: {
        _id: term._id,
        name: term.name,
        startDate:
          term.startDate || null,
        endDate:
          term.endDate || null,
      },

      results: results.map(
        (result) => ({
          subjectName:
            result.subjectId?.name ||
            "",

          subjectCode:
            result.subjectId?.code ||
            "",

          ca1:
            result.ca1 || 0,

          ca2:
            result.ca2 || 0,

          assignment:
            result.assignment || 0,

          exam:
            result.exam || 0,

          total:
            result.total || 0,

          grade:
            result.grade || "",

          remark:
            result.remark || "",
        })
      ),

      summary: {
        subjectsCount:
          results.length,

        totalScore,

        averageScore,

        position,

        positionLabel:
          ordinal(position),
      },

      attendance,
    },
  };
}

/* =========================================================
   CLASS REPORT SHEET
========================================================= */

export async function generateClassReportSheet({
  user,
  classId,
  sessionId,
  termId,
}) {
  /* -------------------------------------------------------
     AUTH
  ------------------------------------------------------- */

  if (
    ![
      "school_admin",
      "teacher",
    ].includes(user.role)
  ) {
    throw new ApiError(
      403,
      "Unauthorized access"
    );
  }

  /* -------------------------------------------------------
     VALIDATE IDS
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     CLASS
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     SESSION + TERM
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     STUDENTS
  ------------------------------------------------------- */

  const students =
    await Student.find({
      schoolId,
      classId: classObjectId,
      status: "active",
    }).select(
      "_id firstName lastName admissionNumber"
    );

  const studentIds =
    students.map(
      (student) => student._id
    );

  /* -------------------------------------------------------
     RESULTS
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     MAP STUDENTS
  ------------------------------------------------------- */

  const map = new Map();

  students.forEach(
    (student) => {
      map.set(
        String(student._id),
        {
          studentId:
            student._id,

          admissionNumber:
            student.admissionNumber,

          firstName:
            student.firstName,

          lastName:
            student.lastName,

          subjects: [],

          totalScore: 0,

          subjectCount: 0,

          averageScore: 0,

          position: 0,

          positionLabel: "",
        }
      );
    }
  );

  /* -------------------------------------------------------
     GROUP RESULTS
  ------------------------------------------------------- */

  results.forEach(
    (result) => {
      const row =
        map.get(
          String(
            result.studentId
          )
        );

      if (!row) return;

      row.subjects.push({
        subjectName:
          result.subjectId?.name ||
          "",

        subjectCode:
          result.subjectId?.code ||
          "",

        ca1:
          result.ca1 || 0,

        ca2:
          result.ca2 || 0,

        assignment:
          result.assignment || 0,

        exam:
          result.exam || 0,

        total:
          result.total || 0,

        grade:
          result.grade || "",

        remark:
          result.remark || "",
      });

      row.totalScore +=
        result.total || 0;

      row.subjectCount += 1;
    }
  );

  /* -------------------------------------------------------
     AVERAGE
  ------------------------------------------------------- */

  map.forEach(
    (row) => {
      row.averageScore =
        row.subjectCount > 0
          ? Number(
              (
                row.totalScore /
                row.subjectCount
              ).toFixed(2)
            )
          : 0;
    }
  );

  /* -------------------------------------------------------
     RANKING
  ------------------------------------------------------- */

  const ranked =
    Array.from(
      map.values()
    ).sort(
      (a, b) =>
        b.totalScore -
        a.totalScore
    );

  ranked.forEach(
    (student, index) => {
      student.position =
        index + 1;

      student.positionLabel =
        ordinal(index + 1);
    }
  );

  /* -------------------------------------------------------
     RESPONSE
  ------------------------------------------------------- */

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

/* =========================================================
   ALL CLASS REPORT CARDS
========================================================= */

export async function generateClassReportCardsBundle({
  user,
  classId,
  sessionId,
  termId,
}) {
  /* -------------------------------------------------------
     AUTH
  ------------------------------------------------------- */

  if (
    ![
      "school_admin",
      "teacher",
    ].includes(user.role)
  ) {
    throw new ApiError(
      403,
      "Unauthorized access"
    );
  }

  /* -------------------------------------------------------
     VALIDATE IDS
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     CLASS
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     STUDENTS
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     GENERATE REPORTS
  ------------------------------------------------------- */

  const reports = [];

  for (const student of students) {
    try {
      const report =
        await generateStudentReportCard({
          user,

          studentId:
            student._id,

          sessionId,

          termId,
        });

      /*
       * IMPORTANT:
       *
       * generateStudentReportCard()
       * returns:
       *
       * {
       *   reportCard: {...}
       * }
       *
       * So we push report.reportCard,
       * not the wrapper itself.
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
            student.firstName,

          lastName:
            student.lastName,

          admissionNumber:
            student.admissionNumber,
        },

        error: true,

        message:
          "Failed to generate report card",
      });
    }
  }

  /* -------------------------------------------------------
     CLASS RANKING SUMMARY
  ------------------------------------------------------- */

  const ranked =
    reports
      .filter(
        (report) =>
          !report.error
      )
      .sort(
        (a, b) =>
          (b.summary?.totalScore ||
            0) -
          (a.summary?.totalScore ||
            0)
      );

  ranked.forEach(
    (report, index) => {
      if (report.summary) {
        report.summary.position =
          index + 1;

        report.summary.positionLabel =
          ordinal(index + 1);
      }
    }
  );

  /* -------------------------------------------------------
     RESPONSE
  ------------------------------------------------------- */

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
