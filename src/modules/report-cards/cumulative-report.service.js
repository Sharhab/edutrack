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
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;

  return `${n}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]}`;
}

function gradeForAverage(value) {
  if (value >= 75) return { grade: "A", remark: "Excellent" };
  if (value >= 60) return { grade: "B", remark: "Good" };
  if (value >= 50) return { grade: "C", remark: "Fair" };
  if (value >= 40) return { grade: "D", remark: "Pass" };

  return { grade: "F", remark: "Fail" };
}

function summarizeAttendance(records = []) {
  const present = records.filter((x) => x.status === "present").length;
  const absent = records.filter((x) => x.status === "absent").length;
  const late = records.filter((x) => x.status === "late").length;
  const total = records.length;

  return {
    total,
    present,
    absent,
    late,
    percentage: total ? Math.round((present / total) * 100) : 0,
  };
}

/* =========================================
   STUDENT CUMULATIVE REPORT
========================================= */

export async function generateCumulativeStudentReport({
  user,
  studentId,
  sessionId,
}) {
  if (!["school_admin", "teacher", "parent"].includes(user.role)) {
    throw new ApiError(403, "Unauthorized access");
  }

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid student ID");
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new ApiError(400, "Invalid session ID");
  }

  if (user.role === "parent") {
    await ensureParentOwnsStudent(user, studentId);
  }

  const schoolId = new mongoose.Types.ObjectId(user.schoolId);
  const studentObjectId = new mongoose.Types.ObjectId(studentId);
  const sessionObjectId = new mongoose.Types.ObjectId(sessionId);

  const [student, session] = await Promise.all([
    Student.findOne({
      _id: studentObjectId,
      schoolId,
    }).populate("classId", "name level"),

    Session.findOne({
      _id: sessionObjectId,
      schoolId,
    }),
  ]);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (!student.classId) {
    throw new ApiError(400, "Student is not assigned to a class");
  }

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  /* =========================================
     GET ALL TERMS IN THE SELECTED SESSION
  ========================================= */

  const terms = await Term.find({
    schoolId,
    sessionId: sessionObjectId,
  })
    .sort({
      order: 1,
      startDate: 1,
      createdAt: 1,
    })
    .lean();

  if (!terms.length) {
    throw new ApiError(
      404,
      "No terms configured for this session"
    );
  }

  const termIds = terms.map((term) => term._id);

  /* =========================================
     GET RESULTS AND ATTENDANCE
  ========================================= */

  const [resultDocs, attendanceDocs] = await Promise.all([
    Result.find({
      schoolId,
      studentId: studentObjectId,
      classId: student.classId._id,
      sessionId: sessionObjectId,
      termId: { $in: termIds },
    })
      .populate("subjectId", "name code")
      .lean(),

    Attendance.find({
      schoolId,
      studentId: studentObjectId,
      classId: student.classId._id,
      sessionId: sessionObjectId,
      termId: { $in: termIds },
    })
      .select("termId status date")
      .lean(),
  ]);

  /* =========================================
     GROUP RESULTS BY SUBJECT
  ========================================= */

  const resultBySubject = new Map();

  for (const doc of resultDocs) {
    const subjectId = String(
      doc.subjectId?._id || doc.subjectId
    );

    if (!resultBySubject.has(subjectId)) {
      resultBySubject.set(subjectId, {
        subjectId,
        subjectName: doc.subjectId?.name || "Subject",
        subjectCode: doc.subjectId?.code || "",
        terms: {},
        cumulativeTotal: 0,
        termsWithResults: 0,
      });
    }

    const row = resultBySubject.get(subjectId);
    const termKey = String(doc.termId);

    row.terms[termKey] = {
      score: Number(doc.total || 0),
      grade: doc.grade || "",
      remark: doc.remark || "",
    };

    row.cumulativeTotal += Number(doc.total || 0);
    row.termsWithResults += 1;
  }

  /* =========================================
     CUMULATIVE SUBJECT AVERAGES
  ========================================= */

  const subjects = [...resultBySubject.values()]
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName))
    .map((row) => {
      const availableScores = terms
        .map((term) => row.terms[String(term._id)]?.score)
        .filter((score) => typeof score === "number");

      const average = availableScores.length
        ? Number(
            (
              availableScores.reduce(
                (sum, score) => sum + score,
                0
              ) / availableScores.length
            ).toFixed(1)
          )
        : 0;

      const { grade, remark } = gradeForAverage(average);

      return {
        ...row,
        average,
        cumulativeGrade: grade,
        cumulativeRemark: remark,
      };
    });

  /* =========================================
     TERM SUMMARIES
  ========================================= */

  const termSummaries = terms.map((term) => {
    const scores = subjects
      .map(
        (subject) =>
          subject.terms[String(term._id)]?.score
      )
      .filter((score) => typeof score === "number");

    const totalScore = scores.reduce(
      (sum, score) => sum + score,
      0
    );

    const averageScore = scores.length
      ? Number((totalScore / scores.length).toFixed(1))
      : 0;

    const grade = gradeForAverage(averageScore);

    const attendance = summarizeAttendance(
      attendanceDocs.filter(
        (record) =>
          String(record.termId) === String(term._id)
      )
    );

    return {
      termId: String(term._id),
      termName: term.name,
      order: term.order,
      totalScore,
      averageScore,
      grade: grade.grade,
      remark: grade.remark,
      subjectsCount: scores.length,
      attendance,
    };
  });

  /* =========================================
     OVERALL CUMULATIVE SUMMARY
  ========================================= */

  const cumulativeScores = termSummaries.reduce(
    (sum, term) => sum + term.totalScore,
    0
  );

  const cumulativeScoreCount = termSummaries.reduce(
    (sum, term) => sum + term.subjectsCount,
    0
  );

  const cumulativeAverage = cumulativeScoreCount
    ? Number(
        (cumulativeScores / cumulativeScoreCount).toFixed(1)
      )
    : 0;

  const cumulativeGrade = gradeForAverage(cumulativeAverage);

  /* =========================================
     CLASS RANKING
  ========================================= */

  const classmates = await Student.find({
    schoolId,
    classId: student.classId._id,
    status: "active",
  })
    .select("_id")
    .lean();

  const classStudentIds = classmates.map(
    (item) => item._id
  );

  const classResultDocs = await Result.find({
    schoolId,
    classId: student.classId._id,
    sessionId: sessionObjectId,
    termId: { $in: termIds },
    studentId: { $in: classStudentIds },
  })
    .select("studentId total termId")
    .lean();

  const rankingTotals = new Map();

  for (const result of classResultDocs) {
    const key = String(result.studentId);

    rankingTotals.set(
      key,
      (rankingTotals.get(key) || 0) +
        Number(result.total || 0)
    );
  }

  const ranked = classStudentIds
    .map((id) => ({
      studentId: String(id),
      total: rankingTotals.get(String(id)) || 0,
    }))
    .sort((a, b) => b.total - a.total);

  const positionIndex = ranked.findIndex(
    (item) =>
      item.studentId === String(studentObjectId)
  );

  const position =
    positionIndex >= 0 ? positionIndex + 1 : null;

  const attendance = summarizeAttendance(attendanceDocs);

  /* =========================================
     FINAL REPORT RESPONSE
  ========================================= */

  return {
    report: {
      student: {
        _id: String(student._id),
        admissionNumber: student.admissionNumber || "",
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        gender: student.gender || "",
        photo: student.photo || "",
        className: student.classId.name || "",
        classLevel: student.classId.level || "",
      },

      session: {
        _id: String(session._id),
        name: session.name,
      },

      class: {
        _id: String(student.classId._id),
        name: student.classId.name,
        level: student.classId.level || "",
      },

      terms: terms.map((term) => ({
        _id: String(term._id),
        name: term.name,
        order: term.order,
      })),

      subjects,
      termSummaries,

      summary: {
        totalScore: cumulativeScores,
        averageScore: cumulativeAverage,
        grade: cumulativeGrade.grade,
        remark: cumulativeGrade.remark,
        position,
        positionLabel: position ? ordinal(position) : "—",
        classSize: classmates.length,
        subjectsCount: subjects.length,
      },

      attendance,
      generatedAt: new Date().toISOString(),
    },
  };
}

/* =========================================
   CLASS CUMULATIVE REPORT
========================================= */

export async function generateCumulativeClassReport({
  user,
  classId,
  sessionId,
}) {
  if (!["school_admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "Unauthorized access");
  }

  if (
    !mongoose.Types.ObjectId.isValid(classId) ||
    !mongoose.Types.ObjectId.isValid(sessionId)
  ) {
    throw new ApiError(400, "Invalid class or session ID");
  }

  const schoolId = new mongoose.Types.ObjectId(user.schoolId);
  const classObjectId = new mongoose.Types.ObjectId(classId);
  const sessionObjectId = new mongoose.Types.ObjectId(sessionId);

  const classDoc = await ClassModel.findOne({
    _id: classObjectId,
    schoolId,
  });

  if (!classDoc) {
    throw new ApiError(404, "Class not found");
  }

  const session = await Session.findOne({
    _id: sessionObjectId,
    schoolId,
  });

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  const students = await Student.find({
    schoolId,
    classId: classObjectId,
    status: "active",
  })
    .select("_id firstName lastName admissionNumber")
    .lean();

  const reports = [];

  for (const student of students) {
    try {
      const item = await generateCumulativeStudentReport({
        user,
        studentId: String(student._id),
        sessionId: String(sessionObjectId),
      });

      reports.push(item.report);
    } catch (error) {
      reports.push({
        student: {
          ...student,
          className: classDoc.name,
        },
        error: true,
        message:
          error?.message ||
          "Failed to generate cumulative report",
      });
    }
  }

  const ranked = reports
    .filter((item) => !item.error)
    .sort(
      (a, b) =>
        (b.summary?.totalScore || 0) -
        (a.summary?.totalScore || 0)
    );

  ranked.forEach((report, index) => {
    report.summary.position = index + 1;
    report.summary.positionLabel = ordinal(index + 1);
  });

  return {
    class: {
      _id: String(classDoc._id),
      name: classDoc.name,
      level: classDoc.level || "",
    },

    session: {
      _id: String(session._id),
      name: session.name,
    },

    totalStudents: students.length,
    reports,
  };
}
