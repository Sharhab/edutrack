// modules/report-card/report-card.service.js
import mongoose from "mongoose";
import {
  calculateAverage,
  isValidScore,
  rankStudentsByAverage,
} from "./report-card-calculations.js";
import { Student } from "../students/student.model.js";
import { Result } from "../results/result.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ClassModel } from "../classes/class.model.js";
import { getSchoolGradeBands } from "../results/grading-scale.service.js";
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

function hasEnteredMarks(result) {
  return [
    result.ca1,
    result.ca2,
    result.assignment,
    result.exam,
  ].some(isValidScore);
}

function getRecordedScore(result) {
  if (!hasEnteredMarks(result)) {
    return null;
  }

  const total = Number(result.total);

  return Number.isFinite(total) ? total : null;
}


/* =========================================================
   ACADEMIC PERIOD VALIDATION
   A term must belong to the selected session and school.
========================================================= */
async function getValidatedAcademicPeriod({
  schoolId,
  sessionId,
  termId,
}) {
  const session = await Session.findOne({
    _id: sessionId,
    schoolId,
  });

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  const term = await Term.findOne({
    _id: termId,
    schoolId,
    sessionId: session._id,
  });

  if (!term) {
    throw new ApiError(
      400,
      "Term not found or does not belong to the selected session"
    );
  }

   
  const nextTerm = await Term.findOne({
    schoolId,
    sessionId: session._id,
    order: { $gt: term.order },
  }).sort({
    order: 1,
    startDate: 1,
  });

  return { session, term, nextTerm };
 
}

/* =========================================================
   PERFORMANCE COMMENTS
   Data-driven comments for report cards
========================================================= */

const performanceComments = {
  Excellent: {
    teacher: [
      "The student has demonstrated excellent academic performance this term. Continued dedication, discipline, and active participation are highly commendable.",
      "An outstanding academic performance this term. The student has shown strong understanding, consistency, and commitment to learning.",
      "The student has performed excellently across the term and demonstrated a commendable attitude towards learning. Continued hard work is encouraged.",
    ],

    principal: [
      "An excellent academic performance. The student's commitment and achievement are commendable. We encourage continued excellence.",
      "The student has demonstrated outstanding academic achievement this term. Sustained effort and discipline should be maintained.",
      "A highly commendable performance this term. The student is encouraged to maintain this excellent standard in future terms.",
    ],
  },

  "Very Good": {
    teacher: [
      "The student has demonstrated very good academic performance and a strong understanding of the subjects studied. Continued effort will lead to even greater achievement.",
      "A very good performance this term. The student has shown consistency and good commitment to academic activities.",
      "The student has made very good academic progress this term. Continued revision and active participation are encouraged.",
    ],

    principal: [
      "A very good academic performance this term. The student is encouraged to remain consistent and continue working towards higher achievement.",
      "The student has demonstrated very good progress and commitment to learning. Continued diligence is encouraged.",
      "A commendable performance. With continued dedication, the student can achieve an even higher level of academic success.",
    ],
  },

  Good: {
    teacher: [
      "The student has demonstrated good academic progress this term. Greater consistency in revision and classroom participation will support further improvement.",
      "A good performance this term. The student is encouraged to remain focused and put additional effort into areas that require improvement.",
      "The student has made good progress academically. Continued practice and regular revision will help strengthen overall performance.",
    ],

    principal: [
      "The student has achieved a good academic performance this term. Continued commitment and focused study are encouraged.",
      "A good performance has been recorded this term. Greater consistency will help the student achieve stronger results.",
      "The student's progress is encouraging. Continued effort and attention to weaker areas should lead to further improvement.",
    ],
  },

  Fair: {
    teacher: [
      "The student has achieved a fair level of performance this term. More regular revision, concentration, and classroom participation are encouraged.",
      "The student has made satisfactory progress but requires greater consistency in academic work to improve future results.",
      "A fair performance this term. The student should devote more time to revision and seek assistance where necessary.",
    ],

    principal: [
      "The student has demonstrated satisfactory progress but has room for improvement. Greater commitment to academic work is encouraged.",
      "A fair performance has been recorded. With increased dedication and regular study, stronger results can be achieved.",
      "The student's performance is satisfactory. More consistent effort and academic support should help improve future achievement.",
    ],
  },

  Pass: {
    teacher: [
      "The student has achieved a basic pass this term. More consistent study, concentration, and participation are required for better performance.",
      "The student has attained a passing level but needs to increase effort and develop stronger study habits.",
      "The student has made enough progress to achieve a pass. Greater dedication and regular revision are strongly encouraged.",
    ],

    principal: [
      "The student has achieved a basic pass. Increased commitment and consistent academic effort are required for improved future results.",
      "A passing performance has been recorded. The student is encouraged to work harder and seek support in challenging areas.",
      "The student has made satisfactory progress towards the required standard. Greater diligence is necessary for further improvement.",
    ],
  },

  "Needs Improvement": {
    teacher: [
      "The student needs significant improvement in academic performance. More regular study, classroom participation, and support are strongly encouraged.",
      "The student should devote more time to academic work and develop consistent study habits to improve future performance.",
      "The current performance requires improvement. Regular revision, active participation, and additional academic support are recommended.",
    ],

    principal: [
      "The student's academic performance requires improvement. Greater commitment, regular study, and appropriate support are strongly encouraged.",
      "The student needs to demonstrate greater dedication to academic work. With consistent effort and support, improvement is achievable.",
      "Further academic improvement is required. The student is encouraged to work closely with teachers and maintain consistent study habits.",
    ],
  },
};

/* =========================================================
   PERFORMANCE LEVEL
========================================================= */
function getPerformanceLevel(averageScore, gradeBands = []) {
  if (Array.isArray(gradeBands) && gradeBands.length > 0) {
    const sortedBands = [...gradeBands].sort(
      (a, b) => a.minScore - b.minScore
    );

    const matchingBand = sortedBands.find(
      (band, index) =>
        averageScore >= band.minScore &&
        (
          averageScore < band.maxScore ||
          (
            index === sortedBands.length - 1 &&
            averageScore <= band.maxScore
          )
        )
    );

    if (matchingBand) {
      const remark = String(matchingBand.remark || "")
        .trim()
        .toLowerCase();

      const supportedLevels = {
        excellent: "Excellent",
        "very good": "Very Good",
        good: "Good",
        fair: "Fair",
        pass: "Pass",
        "needs improvement": "Needs Improvement",
        fail: "Needs Improvement",
      };

      if (supportedLevels[remark]) {
        return supportedLevels[remark];
      }
    }
  }

  // Preserve existing comments for unconfigured scales
  // and custom remarks that do not match a comment category.
  if (averageScore >= 80) return "Excellent";
  if (averageScore >= 70) return "Very Good";
  if (averageScore >= 60) return "Good";
  if (averageScore >= 50) return "Fair";
  if (averageScore >= 40) return "Pass";

  return "Needs Improvement";
}

/* =========================================================
   COMMENT HELPERS
========================================================= */

function pickComment(comments, seed = 0) {
  if (!Array.isArray(comments) || !comments.length) {
    return "";
  }

  return comments[Math.abs(seed) % comments.length];
}

function getSubjectPerformanceCategory(score, gradeBands = []) {
  if (!Array.isArray(gradeBands) || gradeBands.length === 0) {
    if (score >= 80) return "strong";
    if (score < 50) return "weak";
    return "average";
  }

  const sortedBands = [...gradeBands].sort(
    (a, b) => a.minScore - b.minScore
  );

  const matchingBand = sortedBands.find(
    (band, index) =>
      score >= band.minScore &&
      (
        score < band.maxScore ||
        (
          index === sortedBands.length - 1 &&
          score <= band.maxScore
        )
      )
  );

  if (!matchingBand) return "average";

  const remark = String(matchingBand.remark || "")
    .trim()
    .toLowerCase();

  if (
    ["excellent", "outstanding", "very good", "good", "credit"].includes(remark)
  ) {
    return "strong";
  }

  if (
    ["fail", "needs improvement", "poor", "needs support"].includes(remark)
  ) {
    return "weak";
  }

  return "average";
}
/* =========================================================
   BUILD PERFORMANCE COMMENT
========================================================= */
function buildReportCardComments({
  averageScore = 0,
  results = [],
  attendance = {},
  studentId = "",
  gradeBands = [],
}) {
  const performanceLevel =
    getPerformanceLevel(averageScore, gradeBands);

  if (!results.length) {
    return {
      performanceLevel: "Not Available",
      classTeacher:
        "Academic performance is not yet available.",
      principal:
        "A report comment will be provided when results are available.",
    };
  }

  const comments =
    performanceComments[performanceLevel];

  const seed = String(studentId)
    .split("")
    .reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0
    );

  let teacherComment = pickComment(
    comments.teacher,
    seed
  );

  let principalComment = pickComment(
    comments.principal,
    seed + 1
  );

  /* =====================================================
     SUBJECT PERFORMANCE
  ===================================================== */

  const strongSubjects = results
  .filter(
    (result) =>
      getSubjectPerformanceCategory(
        Number(result.total || 0),
        gradeBands
      ) === "strong"
  )
  .map((result) => result.subjectId?.name)
  .filter(Boolean);

const weakSubjects = results
  .filter(
    (result) =>
      getSubjectPerformanceCategory(
        Number(result.total || 0),
        gradeBands
      ) === "weak"
  )
  .map((result) => result.subjectId?.name)
  .filter(Boolean);

  /* =====================================================
     ATTENDANCE
  ===================================================== */

  const attendancePercentage =
    Number(attendance?.percentage || 0);

  /*
   * Good attendance
   */
  if (attendancePercentage >= 90) {
    teacherComment +=
      " Attendance has also been very good.";

    principalComment +=
      " The student's regular attendance is also commendable.";
  }

  /*
   * Low attendance
   */
  else if (
    attendancePercentage > 0 &&
    attendancePercentage < 75
  ) {
    teacherComment +=
      " Improved attendance and regular participation are encouraged.";

    principalComment +=
      " Improved attendance will be important for sustained academic progress.";
  }

  /* =====================================================
     STRONG SUBJECTS
  ===================================================== */

  if (
    strongSubjects.length > 0 &&
    averageScore >= 60
  ) {
    const subjects =
      strongSubjects
        .slice(0, 2)
        .join(" and ");

    teacherComment +=
      ` Strong performance was recorded in ${subjects}.`;
  }

  /* =====================================================
     WEAK SUBJECTS
  ===================================================== */

  if (weakSubjects.length > 0) {
    const subjects =
      weakSubjects
        .slice(0, 2)
        .join(" and ");

    teacherComment +=
      ` More attention is needed in ${subjects}.`;

    principalComment +=
      ` The student should give additional attention to ${subjects}.`;
  }

  return {
    performanceLevel,
    classTeacher: teacherComment,
    principal: principalComment,
  };
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
     IF FOUND
  ------------------------------------------------------- */

  if (attendanceRecords.length > 0) {
    const summary =
      buildAttendanceSummary(
        attendanceRecords
      );

    return summary;
  }

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
  if (user.role === "parent") {
    await ensureParentOwnsStudent(user, studentId);
  }

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid student ID");
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new ApiError(400, "Invalid session ID");
  }

  if (!mongoose.Types.ObjectId.isValid(termId)) {
    throw new ApiError(400, "Invalid term ID");
  }

  const schoolId = new mongoose.Types.ObjectId(user.schoolId);
  const studentObjectId = new mongoose.Types.ObjectId(studentId);
  const sessionObjectId = new mongoose.Types.ObjectId(sessionId);
  const termObjectId = new mongoose.Types.ObjectId(termId);

  const gradeBands = await getSchoolGradeBands(schoolId);

  const student = await Student.findOne({
    _id: studentObjectId,
    schoolId,
  }).populate("classId", "name level");

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (!student.classId) {
    throw new ApiError(
      400,
      "Student is not assigned to a class"
    );
  }

  const { session, term, nextTerm } =
    await getValidatedAcademicPeriod({
      schoolId,
      sessionId: sessionObjectId,
      termId: termObjectId,
    });

  const results = await Result.find({
    schoolId,
    studentId: studentObjectId,
    classId: student.classId._id,
    sessionId: sessionObjectId,
    termId: termObjectId,
  })
    .populate("subjectId", "name code")
    .sort({ createdAt: 1 });

  const attendance = await getReportCardAttendance({
    schoolId,
    studentId: studentObjectId,
    classId: student.classId._id,
    sessionId: sessionObjectId,
    termId: termObjectId,
  });

  const recordedResults = results.filter(hasEnteredMarks);

  const recordedScores = recordedResults
    .map(getRecordedScore)
    .filter((score) => score !== null);

  const scoreSummary = calculateAverage(recordedScores);

  const totalScore = scoreSummary.total;
  const averageScore = scoreSummary.average;

  const comments = buildReportCardComments({
    averageScore: averageScore ?? 0,
    results: recordedResults,
    attendance,
    studentId: studentObjectId,
    gradeBands,
  });

  const classmates = await Student.find({
    schoolId,
    classId: student.classId._id,
    status: "active",
  }).select("_id");

  const classmateIds = classmates.map(
    (classmate) => classmate._id
  );

  const classResults = await Result.find({
    schoolId,
    classId: student.classId._id,
    studentId: { $in: classmateIds },
    sessionId: sessionObjectId,
    termId: termObjectId,
  }).select("studentId total ca1 ca2 assignment exam");

  const scoresByStudent = new Map();

  for (const result of classResults) {
    if (!hasEnteredMarks(result)) {
      continue;
    }

    const score = getRecordedScore(result);

    if (score === null) {
      continue;
    }

    const key = String(result.studentId);

    if (!scoresByStudent.has(key)) {
      scoresByStudent.set(key, []);
    }

    scoresByStudent.get(key).push(score);
  }

  const candidates = classmateIds.map((id) => {
    const scores = scoresByStudent.get(String(id)) || [];

    const studentAverage = scores.length
      ? calculateAverage(scores).average
      : null;

    return {
      studentId: id,
      averageScore: studentAverage,
      eligible: studentAverage !== null,
    };
  });

  const ranked = rankStudentsByAverage(candidates);

  const studentRank = ranked.find(
    (item) =>
      String(item.studentId) === String(studentObjectId)
  );

  const position = studentRank?.position ?? null;
  const positionLabel =
    studentRank?.positionLabel || "Not ranked";

  const classStatistics = calculateClassAverageStatistics(
    candidates.filter((candidate) => candidate.eligible)
  );

  return {
    reportCard: {
      student: {
        _id: student._id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        photo: student.photo || "",
        className: student.classId?.name || "",
        classLevel: student.classId?.level || "",
      },

      session: {
        _id: session._id,
        name: session.name,
      },

      term: {
        _id: term._id,
        name: term.name,
        startDate: term.startDate || null,
        endDate: term.endDate || null,
        nextTermResumptionDate: nextTerm?.startDate || null,
      },

      results: results.map((result) => ({
        subjectName: result.subjectId?.name || "",
        subjectCode: result.subjectId?.code || "",
        ca1: isValidScore(result.ca1)
          ? Number(result.ca1)
          : null,
        ca2: isValidScore(result.ca2)
          ? Number(result.ca2)
          : null,
        assignment: isValidScore(result.assignment)
          ? Number(result.assignment)
          : null,
        exam: isValidScore(result.exam)
          ? Number(result.exam)
          : null,
        total: getRecordedScore(result),
        grade: result.grade || "",
        remark: result.remark || "",
      })),

      summary: {
        subjectsCount: recordedResults.length,
        totalScore,
        averageScore,
        position,
        positionLabel,
        classAverage: classStatistics.classAverage,
        highestInClass: classStatistics.highestAverage,
        lowestInClass: classStatistics.lowestAverage,
        rankedStudents: classStatistics.eligibleStudents,
      },

      attendance,
      comments,
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
  if (!["school_admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "Unauthorized access");
  }

  if (
    !mongoose.Types.ObjectId.isValid(classId) ||
    !mongoose.Types.ObjectId.isValid(sessionId) ||
    !mongoose.Types.ObjectId.isValid(termId)
  ) {
    throw new ApiError(400, "Invalid class/session/term ID");
  }

  const schoolId = new mongoose.Types.ObjectId(user.schoolId);
  const classObjectId = new mongoose.Types.ObjectId(classId);
  const sessionObjectId = new mongoose.Types.ObjectId(sessionId);
  const termObjectId = new mongoose.Types.ObjectId(termId);

  const classDoc = await ClassModel.findOne({
    _id: classObjectId,
    schoolId,
  });

  if (!classDoc) {
    throw new ApiError(404, "Class not found");
  }

  const { session, term } = await getValidatedAcademicPeriod({
    schoolId,
    sessionId: sessionObjectId,
    termId: termObjectId,
  });

  const students = await Student.find({
    schoolId,
    classId: classObjectId,
    status: "active",
  }).select("_id firstName lastName admissionNumber");

  const studentIds = students.map((student) => student._id);

  const results = studentIds.length
    ? await Result.find({
        schoolId,
        classId: classObjectId,
        sessionId: sessionObjectId,
        termId: termObjectId,
        studentId: { $in: studentIds },
      })
        .populate("subjectId", "name code")
        .sort({ createdAt: 1 })
    : [];

  const rows = new Map();

  for (const student of students) {
    rows.set(String(student._id), {
      studentId: student._id,
      admissionNumber: student.admissionNumber || "",
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      subjects: [],
      totalScore: 0,
      subjectCount: 0,
      averageScore: null,
      position: null,
      positionLabel: "Not ranked",
    });
  }

  for (const result of results) {
    const row = rows.get(String(result.studentId));

    if (!row) {
      continue;
    }

    const recorded = hasEnteredMarks(result);
    const score = recorded ? getRecordedScore(result) : null;

    row.subjects.push({
      subjectName: result.subjectId?.name || "",
      subjectCode: result.subjectId?.code || "",
      ca1: isValidScore(result.ca1) ? Number(result.ca1) : null,
      ca2: isValidScore(result.ca2) ? Number(result.ca2) : null,
      assignment: isValidScore(result.assignment)
        ? Number(result.assignment)
        : null,
      exam: isValidScore(result.exam) ? Number(result.exam) : null,
      total: score,
      grade: result.grade || "",
      remark: result.remark || "",
    });

    if (score !== null) {
      row.totalScore += score;
      row.subjectCount += 1;
    }
  }

  const candidates = Array.from(rows.values()).map((row) => ({
    studentId: row.studentId,
    studentName: `${row.firstName} ${row.lastName}`.trim(),
    averageScore:
      row.subjectCount > 0
        ? calculateAverage(
            row.subjects
              .map((subject) => subject.total)
              .filter((score) => score !== null)
          ).average
        : null,
    eligible: row.subjectCount > 0,
  }));

  const ranked = rankStudentsByAverage(candidates);
  const rankedById = new Map(
    ranked.map((item) => [String(item.studentId), item])
  );

  const finalStudents = Array.from(rows.values()).map((row) => {
    const ranking = rankedById.get(String(row.studentId));

    return {
      ...row,
      averageScore: ranking?.averageScore ?? null,
      position: ranking?.position ?? null,
      positionLabel: ranking?.positionLabel || "Not ranked",
    };
  });

  finalStudents.sort((a, b) => {
    if (a.position === null && b.position !== null) return 1;
    if (a.position !== null && b.position === null) return -1;
    if (a.position !== b.position) {
      return (a.position ?? Infinity) - (b.position ?? Infinity);
    }

    return `${a.lastName} ${a.firstName}`.localeCompare(
      `${b.lastName} ${b.firstName}`
    );
  });

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
      totalStudents: finalStudents.length,
      students: finalStudents,
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

  // Validate the academic period even when the class has no active students.
  await getValidatedAcademicPeriod({
    schoolId,
    sessionId: new mongoose.Types.ObjectId(sessionId),
    termId: new mongoose.Types.ObjectId(termId),
  });

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
