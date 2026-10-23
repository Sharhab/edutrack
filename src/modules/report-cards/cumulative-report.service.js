
import mongoose from "mongoose";

import { Student } from "../students/student.model.js";
import { Result } from "../results/result.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ClassModel } from "../classes/class.model.js";

import { ensureParentOwnsStudent } from "../parents/parent.guard.js";
import { ApiError } from "../../utils/apiError.js";
import { getSchoolGradeBands } from "../results/grading-scale.service.js";

import {
  calculateAverage,
  calculateClassAverageStatistics,
  isValidScore,
  rankStudentsByAverage,
} from "./report-card-calculations.js";

/* =========================================
   HELPERS
========================================= */

/**
 * Determine whether an assessment result has any entered marks.
 * Explicit zero is a valid mark; blank/null is not.
 */
function hasEnteredMarks(result = {}) {
  return [
    result.ca1,
    result.ca2,
    result.assignment,
    result.exam,
  ].some(isValidScore);
}

/**
 * Determine whether the annual record has at least one valid
 * result in every configured term.
 *
 * This is a minimum completeness check, not a substitute for
 * verifying every required subject against the school's curriculum.
 */
function hasResultsForEveryTerm(studentTermScores, terms) {
  if (!terms.length) return false;

  return terms.every((term) => {
    const scores = studentTermScores.get(String(term._id));

    return Array.isArray(scores) && scores.length > 0;
  });
}

/**
 * Use the school's grading scale where configured.
 * The fallback retains this service's previous thresholds.
 */
function gradeForAverage(value, bands = []) {
  if (!isValidScore(value)) {
    return { grade: "", remark: "" };
  }

  if (!Array.isArray(bands) || bands.length === 0) {
    if (value >= 75) return { grade: "A", remark: "Excellent" };
    if (value >= 60) return { grade: "B", remark: "Good" };
    if (value >= 50) return { grade: "C", remark: "Fair" };
    if (value >= 40) return { grade: "D", remark: "Pass" };

    return { grade: "F", remark: "Fail" };
  }

  const sortedBands = [...bands].sort(
    (a, b) => a.minScore - b.minScore
  );

  const matchingBand = sortedBands.find(
    (band, index) =>
      value >= band.minScore &&
      (value < band.maxScore ||
        (index === sortedBands.length - 1 &&
          value <= band.maxScore))
  );

  if (!matchingBand) {
    throw new ApiError(
      500,
      `No grading band matches cumulative average ${value}.`
    );
  }

  return {
    grade: matchingBand.grade,
    remark: matchingBand.remark,
  };
}

function summarizeAttendance(records = []) {
  const present = records.filter(
    (record) => record.status === "present"
  ).length;

  const absent = records.filter(
    (record) => record.status === "absent"
  ).length;

  const late = records.filter(
    (record) => record.status === "late"
  ).length;

  const total = records.length;

  return {
    total,
    present,
    absent,
    late,
    percentage: total
      ? Math.round((present / total) * 100)
      : 0,
  };
}

/**
 * Convert a student's subject/term records into a comparable
 * annual average.
 *
 * Each subject's average is calculated across its available terms.
 * The student's annual average is then the average of those
 * subject averages, so a term with more recorded subjects does
 * not automatically receive extra weight.
 */
function calculateStudentAnnualPerformance(resultDocs, terms) {
  const subjectScores = new Map();
  const termScores = new Map();

  for (const term of terms) {
    termScores.set(String(term._id), []);
  }

  for (const result of resultDocs) {
    if (!hasEnteredMarks(result)) continue;

    const subjectId = String(
      result.subjectId?._id || result.subjectId
    );

    const termId = String(result.termId);
    const score = Number(result.total);

    if (!subjectScores.has(subjectId)) {
      subjectScores.set(subjectId, new Map());
    }

    subjectScores.get(subjectId).set(termId, score);

    if (termScores.has(termId)) {
      termScores.get(termId).push(score);
    }
  }

  const subjectAverages = [];

  for (const scoresByTerm of subjectScores.values()) {
    const average = calculateAverage(
      [...scoresByTerm.values()]
    );

    if (average.average !== null) {
      subjectAverages.push(average.average);
    }
  }

  const annualAverage = calculateAverage(subjectAverages);

  return {
    averageScore: annualAverage.average,
    subjectsCount: subjectAverages.length,
    subjectAverages,
    termScores,
    completeForRanking: hasResultsForEveryTerm(
      termScores,
      terms
    ),
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

  const gradeBands = await getSchoolGradeBands(schoolId);

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
     LOAD TERMS IN THE SELECTED SESSION
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
     LOAD STUDENT RESULTS AND ATTENDANCE
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
    const validResult = hasEnteredMarks(doc);

    row.terms[termKey] = {
      score: validResult ? Number(doc.total) : null,
      grade: validResult ? doc.grade || "" : "",
      remark: validResult ? doc.remark || "" : "",
      hasResult: validResult,
    };

    if (validResult) {
      row.cumulativeTotal += Number(doc.total);
      row.termsWithResults += 1;
    }
  }

  /* =========================================
     CALCULATE ANNUAL SUBJECT AVERAGES
  ========================================= */

  const subjects = [...resultBySubject.values()]
    .sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName)
    )
    .map((row) => {
      const availableScores = terms
        .map((term) => row.terms[String(term._id)]?.score)
        .filter(isValidScore);

      const averageResult = calculateAverage(availableScores);
      const average = averageResult.average;

      const gradeResult = gradeForAverage(
        average,
        gradeBands
      );

      return {
        ...row,
        average,
        cumulativeGrade: gradeResult.grade,
        cumulativeRemark: gradeResult.remark,
      };
    });

  /* =========================================
     TERM SUMMARIES
  ========================================= */

  const termSummaries = terms.map((term) => {
    const scores = subjects
      .map((subject) =>
        subject.terms[String(term._id)]?.score
      )
      .filter(isValidScore);

    const averageResult = calculateAverage(scores);
    const totalScore = averageResult.count
      ? averageResult.total
      : null;

    const averageScore = averageResult.average;

    const gradeResult = gradeForAverage(
      averageScore,
      gradeBands
    );

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
      grade: gradeResult.grade,
      remark: gradeResult.remark,
      subjectsCount: averageResult.count,
      attendance,
    };
  });

  /* =========================================
     ANNUAL SUMMARY
  ========================================= */

  const annualSubjectAverages = subjects
    .map((subject) => subject.average)
    .filter(isValidScore);

  const annualAverageResult = calculateAverage(
    annualSubjectAverages
  );

  const cumulativeAverage = annualAverageResult.average;
  const cumulativeScores = annualAverageResult.count
    ? annualAverageResult.total
    : null;

  const cumulativeGrade = gradeForAverage(
    cumulativeAverage,
    gradeBands
  );

  const currentStudentPerformance =
    calculateStudentAnnualPerformance(resultDocs, terms);

  /* =========================================
     LOAD CLASSMATES AND THEIR ANNUAL RESULTS
  ========================================= */

  const classmates = await Student.find({
    schoolId,
    classId: student.classId._id,
    status: "active",
  })
    .select("_id firstName lastName admissionNumber")
    .lean();

  const classStudentIds = classmates.map(
    (classmate) => classmate._id
  );

  const classResultDocs = await Result.find({
    schoolId,
    classId: student.classId._id,
    sessionId: sessionObjectId,
    termId: { $in: termIds },
    studentId: { $in: classStudentIds },
  })
    .populate("subjectId", "name code")
    .lean();

  const resultsByStudent = new Map();

  for (const result of classResultDocs) {
    const key = String(result.studentId);

    if (!resultsByStudent.has(key)) {
      resultsByStudent.set(key, []);
    }

    resultsByStudent.get(key).push(result);
  }

  const rankingCandidates = classmates.map((classmate) => {
    const studentResults =
      resultsByStudent.get(String(classmate._id)) || [];

    const performance = calculateStudentAnnualPerformance(
      studentResults,
      terms
    );

    return {
      studentId: String(classmate._id),
      studentName:
        `${classmate.firstName || ""} ${classmate.lastName || ""}`.trim(),
      averageScore: performance.averageScore,
      subjectsCount: performance.subjectsCount,
      eligible: performance.completeForRanking &&
        performance.averageScore !== null,
    };
  });

  const ranked = rankStudentsByAverage(rankingCandidates);

  const currentStudentRanking = ranked.find(
    (item) =>
      item.studentId === String(studentObjectId)
  );

  const position = currentStudentRanking?.position ?? null;
  const positionLabel =
    currentStudentRanking?.positionLabel || "Not ranked";

  const classStatistics = calculateClassAverageStatistics(
    rankingCandidates.filter((candidate) => candidate.eligible)
  );

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
        positionLabel,
        classSize: classmates.length,
        subjectsCount: subjects.filter(
          (subject) => subject.termsWithResults > 0
        ).length,
        highestAverage: classStatistics.highestAverage,
        lowestAverage: classStatistics.lowestAverage,
        classAverage: classStatistics.classAverage,
        eligibleStudents: classStatistics.eligibleStudents,
        completeForRanking:
          currentStudentPerformance.completeForRanking,
      },

      attendance: summarizeAttendance(attendanceDocs),
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

  const [classDoc, session] = await Promise.all([
    ClassModel.findOne({
      _id: classObjectId,
      schoolId,
    }),

    Session.findOne({
      _id: sessionObjectId,
      schoolId,
    }),
  ]);

  if (!classDoc) {
    throw new ApiError(404, "Class not found");
  }

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
      const result = await generateCumulativeStudentReport({
        user,
        studentId: String(student._id),
        sessionId: String(sessionObjectId),
      });

      reports.push(result.report);
    } catch (error) {
      reports.push({
        student: {
          _id: String(student._id),
          firstName: student.firstName || "",
          lastName: student.lastName || "",
          admissionNumber: student.admissionNumber || "",
          className: classDoc.name,
        },
        error: true,
        message:
          error?.message ||
          "Failed to generate cumulative report",
      });
    }
  }

  // Do not re-rank here: each individual report already uses
  // the same class-wide annual averages and tie policy.
  reports.sort((a, b) => {
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;

    const positionA = a.summary?.position;
    const positionB = b.summary?.position;

    if (positionA == null && positionB == null) return 0;
    if (positionA == null) return 1;
    if (positionB == null) return -1;

    return positionA - positionB;
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
