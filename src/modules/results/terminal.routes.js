
import mongoose from "mongoose";
import { Result } from "./result.model.js";
import { Student } from "../students/student.model.js";
import { ClassModel } from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { Teacher } from "../teachers/teacher.model.js";

import { ensureParentOwnsStudent } from "../parents/parent.guard.js";

import { ApiError } from "../../utils/apiError.js";
import { computeGrade } from "../../utils/grade.js";

/* =========================================
   VALIDATE REFERENCES
========================================= */
async function validateRefs(payload, schoolId) {
  const student = await Student.findOne({
    _id: payload.studentId,
    schoolId,
  });

  if (!student) throw new ApiError(400, "Invalid student");

  const classDoc = await ClassModel.findOne({
    _id: payload.classId,
    schoolId,
  });

  if (!classDoc) throw new ApiError(400, "Invalid class");

  const subject = await SubjectModel.findOne({
    _id: payload.subjectId,
    schoolId,
  });

  if (!subject) throw new ApiError(400, "Invalid subject");

  const session = await Session.findOne({
    _id: payload.sessionId,
    schoolId,
  });

  if (!session) throw new ApiError(400, "Invalid session");

  const term = await Term.findOne({
    _id: payload.termId,
    schoolId,
  });

  if (!term) throw new ApiError(400, "Invalid term");

  return { student, classDoc, subject, session, term };
}


/* =========================================
   TEACHER ACCESS VALIDATION
========================================= */
export async function ensureTeacherCanEnter({
  teacherId,
  classId,
  subjectId,
  schoolId,
}) {
  const teacher = await Teacher.findOne({
    userId: teacherId,
    schoolId,
  });

  if (!teacher) {
    throw new ApiError(
      404,
      "Teacher not found"
    );
  }

  // SUBJECT VALIDATION
  const teachesSubject = teacher.subjectIds.some(
    (id) => id.toString() === subjectId.toString()
  );

  if (!teachesSubject) {
    throw new ApiError(
      403,
      "Teacher is not assigned to this subject"
    );
  }

  // CLASS VALIDATION
  const teachesClass = teacher.classIds.some(
    (id) => id.toString() === classId.toString()
  );

  if (!teachesClass) {
    throw new ApiError(
      403,
      "Teacher is not assigned to this class"
    );
  }

  return teacher;
}
/* =========================================
   FORMAT RESULT
========================================= */

/* =========================================
   FORMAT RESULT (UNIFIED OUTPUT CONTRACT)
========================================= */
function formatResult(result) {
  return {
    _id: result._id,

    studentId: result.studentId?._id || "",
    studentName: result.studentId
      ? `${result.studentId.firstName || ""} ${result.studentId.lastName || ""}`.trim()
      : "Unknown Student",

    admissionNumber: result.studentId?.admissionNumber || "",

    classId: result.classId?._id || "",
    className: result.classId?.name || "",

    subjectId: result.subjectId?._id || "",
    subjectName: result.subjectId?.name || "",
    subjectCode: result.subjectId?.code || "",

    sessionId: result.sessionId?._id || "",
    sessionName: result.sessionId?.name || "",

    termId: result.termId?._id || "",
    termName: result.termId?.name || "",

    ca1: result.ca1 || 0,
    ca2: result.ca2 || 0,
    assignment: result.assignment || 0,
    exam: result.exam || 0,

    total: result.total || 0,
    grade: result.grade || "",
    remark: result.remark || "",

    status: result.status || "draft",
    published: result.published || false,
    locked: result.locked || false,

    enteredBy: result.enteredBy
      ? `${result.enteredBy.firstName || ""} ${result.enteredBy.lastName || ""}`.trim()
      : "",

    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

/* =========================================
   CREATE OR UPDATE RESULT (CORE ENGINE)
========================================= */
export async function createOrUpdateResult(payload, user) {
  const schoolId = user.schoolId;

  await validateRefs(payload, schoolId);

  await ensureTeacherCanEnter({
    user,
    classId: payload.classId,
    subjectId: payload.subjectId,
  });

  const ca1 = Number(payload.ca1 || 0);
  const ca2 = Number(payload.ca2 || 0);
  const assignment = Number(payload.assignment || 0);
  const exam = Number(payload.exam || 0);

  const total = ca1 + ca2 + assignment + exam;
  const { grade, remark } = computeGrade(total);

  const result = await Result.findOneAndUpdate(
    {
      schoolId,
      studentId: payload.studentId,
      subjectId: payload.subjectId,
      sessionId: payload.sessionId,
      termId: payload.termId,
    },
    {
      $set: {
        schoolId,
        studentId: payload.studentId,
        classId: payload.classId,
        subjectId: payload.subjectId,
        sessionId: payload.sessionId,
        termId: payload.termId,

        ca1,
        ca2,
        assignment,
        exam,

        total,
        grade,
        remark,

        status: "draft",
        enteredBy: user._id || user.id,
      },
    },
    { new: true, upsert: true }
  )
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("classId", "name")
    .populate("subjectId", "name code")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .populate("enteredBy", "firstName lastName");

  return formatResult(result);
}

/* =========================================
   BULK UPSERT (FAST ENTRY ENGINE)
========================================= */
export async function bulkUpsertResults(payload, user) {
  const schoolId = user.schoolId;

  if (!Array.isArray(payload.results)) {
    throw new ApiError(400, "Results must be an array");
  }

  await ensureTeacherCanEnter({
    user,
    classId: payload.classId,
    subjectId: payload.subjectId,
  });

  const ops = payload.results.map((r) => {
    const ca1 = Number(r.ca1 || 0);
    const ca2 = Number(r.ca2 || 0);
    const assignment = Number(r.assignment || 0);
    const exam = Number(r.exam || 0);

    const total = ca1 + ca2 + assignment + exam;
    const { grade, remark } = computeGrade(total);

    return {
      updateOne: {
        filter: {
          schoolId,
          studentId: r.studentId,
          subjectId: payload.subjectId,
          sessionId: payload.sessionId,
          termId: payload.termId,
        },
        update: {
          $set: {
            schoolId,
            studentId: r.studentId,
            classId: payload.classId,
            subjectId: payload.subjectId,
            sessionId: payload.sessionId,
            termId: payload.termId,

            ca1,
            ca2,
            assignment,
            exam,

            total,
            grade,
            remark,

            status: "draft",
            enteredBy: user._id,
          },
        },
        upsert: true,
      },
    };
  });

  await Result.bulkWrite(ops);

  return {
    success: true,
    updated: ops.length,
  };
}

/* =========================================
   ADMIN SUMMARY (CLASS PROGRESS TRACKING)
========================================= */
export async function getAdminResultSummary({
  schoolId,
  sessionId,
  termId,
}) {
  const match = {
    schoolId: new mongoose.Types.ObjectId(schoolId),
  };

  if (sessionId) match.sessionId = new mongoose.Types.ObjectId(sessionId);
  if (termId) match.termId = new mongoose.Types.ObjectId(termId);

  const summary = await Result.aggregate([
    { $match: match },

    {
      $group: {
        _id: {
          classId: "$classId",
          status: "$status",
        },
        total: { $sum: 1 },
      },
    },

    {
      $lookup: {
        from: "classes",
        localField: "_id.classId",
        foreignField: "_id",
        as: "class",
      },
    },

    { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },

    {
      $project: {
        classId: "$_id.classId",
        className: "$class.name",
        status: "$_id.status",
        total: 1,
      },
    },
  ]);

  const grouped = {};

  for (const item of summary) {
    const key = item.classId?.toString();

    if (!grouped[key]) {
      grouped[key] = {
        classId: item.classId,
        className: item.className || "Unknown Class",

        draft: 0,
        locked: 0,
        published: 0,

        totalResults: 0,
        progress: 0,
      };
    }

    grouped[key][item.status] =
      (grouped[key][item.status] || 0) + item.total;

    grouped[key].totalResults += item.total;
  }

  return Object.values(grouped).map((c) => {
    const completed = c.locked + c.published;

    return {
      ...c,
      progress:
        c.totalResults > 0
          ? Math.round((completed / c.totalResults) * 100)
          : 0,
    };
  });
}

/* =========================================
   ADMIN OVERVIEW
========================================= */
export async function getAdminResultsOverview({
  schoolId,
  sessionId,
  termId,
}) {
  const filter = { schoolId };

  if (sessionId) filter.sessionId = sessionId;
  if (termId) filter.termId = termId;

  const results = await Result.find(filter);

  const totalResults = results.length;

  const totalStudents = new Set(
    results.map((r) => String(r.studentId))
  ).size;

  const publishedResults = results.filter((r) => r.published).length;
  const lockedResults = results.filter((r) => r.locked).length;

  const averageScore =
    totalResults > 0
      ? (
          results.reduce((sum, r) => sum + (r.total || 0), 0) /
          totalResults
        ).toFixed(2)
      : 0;

  return {
    totalResults,
    totalStudents,
    publishedResults,
    lockedResults,
    averageScore,
  };
}

/* =========================================
   GENERATE CLASS RESULTS (FINAL FIXED)
========================================= */
export async function generateClassResults(params) {
  const { schoolId, classId, subjectId, sessionId, termId } = params;

  const results = await Result.find({
    schoolId,
    classId,
    subjectId,
    sessionId,
    termId,
  });

  let updated = 0;

  for (const r of results) {
    const total =
      Number(r.ca1 || 0) +
      Number(r.ca2 || 0) +
      Number(r.assignment || 0) +
      Number(r.exam || 0);

    const { grade, remark } = computeGrade(total);

    r.total = total;
    r.grade = grade;
    r.remark = remark;
    r.status = "generated";

    await r.save();
    updated++;
  }

  return { success: true, generated: updated };
}

/* =========================================
   PUBLISH RESULTS
========================================= */
export async function publishClassResults(params) {
  const { schoolId, classId, subjectId, sessionId, termId } = params;

  const res = await Result.updateMany(
    { schoolId, classId, subjectId, sessionId, termId },
    { $set: { published: true, status: "published" } }
  );

  return { success: true, updated: res.modifiedCount };
}

/* =========================================
   LOCK / UNLOCK
========================================= */
export async function lockClassResults(params) {
  const { schoolId, classId, subjectId, sessionId, termId } = params;

  const res = await Result.updateMany(
    { schoolId, classId, subjectId, sessionId, termId },
    { $set: { locked: true } }
  );

  return { success: true, updated: res.modifiedCount };
}

export async function unlockClassResults(params) {
  const { schoolId, classId, subjectId, sessionId, termId } = params;

  const res = await Result.updateMany(
    { schoolId, classId, subjectId, sessionId, termId },
    { $set: { locked: false } }
  );

  return { success: true, updated: res.modifiedCount };
}

/* =========================================
   LIST RESULTS
========================================= */
export async function listResults(query, user) {
  const filter = { schoolId: user.schoolId };

  if (query.classId) filter.classId = query.classId;
  if (query.studentId) filter.studentId = query.studentId;
  if (query.subjectId) filter.subjectId = query.subjectId;
  if (query.sessionId) filter.sessionId = query.sessionId;
  if (query.termId) filter.termId = query.termId;

  const results = await Result.find(filter)
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("classId", "name")
    .populate("subjectId", "name code")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .sort({ createdAt: -1 });

  return results.map(formatResult);
}
/* =========================================
   STUDENT RESULTS (UNCHANGED)
========================================= */
export async function getStudentResults(studentId, user) {
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  // Parent restriction
  if (user.role === "parent") {
    await ensureParentOwnsStudent(user, studentId);
  }

  const results = await Result.find({
    schoolId: user.schoolId,
    studentId,
  })
    .populate("subjectId", "name code")
    .populate("classId", "name")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .sort({ createdAt: -1 });

  return results.map(formatResult);
}
