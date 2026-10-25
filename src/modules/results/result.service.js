import mongoose from "mongoose";
import { Result } from "./result.model.js";
import { computeGrade } from "./grade.utils.js";
import { ApiError } from "../../utils/apiError.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import {
  getResultScheme,
} from "./result-scheme.service.js";

import {
  calculateDynamicResultFields,
} from "./assessment-calculation.service.js";
import { getSchoolGradeBands } from "./grading-scale.service.js";
/* =========================================
   CORE UTILS (SINGLE SOURCE OF TRUTH)
========================================= */

/**
 * Score limits
 *
 * CA1        = 10
 * CA2        = 10
 * Assignment = 10
 * Exam       = 70
 * Total      = 100
 */
const SCORE_LIMITS = {
  ca1: 10,
  ca2: 10,
  assignment: 10,
  exam: 70,
};

/**
 * Convert a score safely.
 *
 * IMPORTANT:
 * - undefined/null/"" stays null
 * - 0 stays 0
 * - valid numbers stay numbers
 */
function normalizeScore(value, max) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const score = Number(value);

  if (!Number.isFinite(score)) {
    return null;
  }

  return Math.min(Math.max(score, 0), max);
}

function calculateResultFields(payload, gradeBands = []) {
  const ca1 = normalizeScore(
    payload.ca1,
    SCORE_LIMITS.ca1
  );

  const ca2 = normalizeScore(
    payload.ca2,
    SCORE_LIMITS.ca2
  );

  const assignment = normalizeScore(
    payload.assignment,
    SCORE_LIMITS.assignment
  );

  const exam = normalizeScore(
    payload.exam,
    SCORE_LIMITS.exam
  );

  /*
   * Only entered scores contribute to the total.
   *
   * Example:
   * CA1 = 8
   * CA2 = blank
   * Assignment = blank
   * Exam = blank
   *
   * Total = 8
   *
   * If everything is blank:
   * total = 0
   * grade/remark remain blank.
   */
  const total =
    (ca1 ?? 0) +
    (ca2 ?? 0) +
    (assignment ?? 0) +
    (exam ?? 0);

  const hasAnyScore =
    ca1 !== null ||
    ca2 !== null ||
    assignment !== null ||
    exam !== null;

  let grade = "";
  let remark = "";

  if (hasAnyScore) {
const computed = computeGrade(total, gradeBands);

    grade = computed.grade;
    remark = computed.remark;
  }

  return {
    ca1,
    ca2,
    assignment,
    exam,
    total,
    grade,
    remark,
  };
}

/* =========================================
   FORMATTER (DTO)
========================================= */

function formatResult(result) {
  const rawScores =
    result.scores instanceof Map
      ? Object.fromEntries(result.scores.entries())
      : result.scores && typeof result.scores === "object"
        ? { ...result.scores }
        : {};

  const assessmentScheme = result.assessmentScheme
    ? {
        version: result.assessmentScheme.version ?? 1,
        totalMax: result.assessmentScheme.totalMax ?? 100,
        components: Array.isArray(result.assessmentScheme.components)
          ? result.assessmentScheme.components.map((component) => ({
              key: component.key,
              label: component.label,
              maxScore: component.maxScore,
            }))
          : [],
      }
    : null;

  return {
    _id: result._id,

    studentId: result.studentId?._id || result.studentId || "",
    studentName: result.studentId
      ? `${result.studentId.firstName || ""} ${
          result.studentId.lastName || ""
        }`.trim() || "Unknown Student"
      : "Unknown Student",
    admissionNumber: result.studentId?.admissionNumber || "",

    classId: result.classId?._id || result.classId || "",
    className: result.classId?.name || "",

    subjectId: result.subjectId?._id || result.subjectId || "",
    subjectName: result.subjectId?.name || "",
    subjectCode: result.subjectId?.code || "",

    sessionId: result.sessionId?._id || result.sessionId || "",
    sessionName: result.sessionId?.name || "",

    termId: result.termId?._id || result.termId || "",
    termName: result.termId?.name || "",

    // Legacy fields retained for existing frontend pages and reports.
    ca1: result.ca1 ?? null,
    ca2: result.ca2 ?? null,
    assignment: result.assignment ?? null,
    exam: result.exam ?? null,

    // Dynamic assessment data for the new frontend.
    scores: rawScores,
    assessmentScheme,

    total: result.total ?? 0,
    grade: result.grade || "",
    remark: result.remark || "",

    status: result.status || "draft",
    published: result.published || false,
    locked: result.locked || false,

    enteredBy: result.enteredBy
      ? `${result.enteredBy.firstName || ""} ${
          result.enteredBy.lastName || ""
        }`.trim()
      : "",

    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}


async function validateResultAcademicPeriod({
  schoolId,
  sessionId,
  termId,
}) {
  if (!sessionId || !termId) {
    throw new ApiError(
      400,
      "Academic session and term are required"
    );
  }

  const session = await Session.findOne({
    _id: sessionId,
    schoolId,
  });

  if (!session) {
    throw new ApiError(
      400,
      "Invalid academic session"
    );
  }

  const term = await Term.findOne({
    _id: termId,
    schoolId,
    sessionId: session._id,
  });

  if (!term) {
    throw new ApiError(
      400,
      "Invalid term or the term does not belong to the selected session"
    );
  }

  return { session, term };
}


/* =========================================
   TEACHER VALIDATION (STANDARDIZED)
========================================= */

export async function ensureTeacherCanEnter({
  user,
  schoolId,
  classId,
  subjectId,
}) {
  console.log("ENSURE USER:", user);

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const userId = (
    user._id ||
    user.id
  )?.toString();

  if (!userId) {
    throw new ApiError(
      401,
      "Invalid user"
    );
  }

  const teacher = await mongoose
    .model("Teacher")
    .findOne({
      userId: new mongoose.Types.ObjectId(userId),
      schoolId: new mongoose.Types.ObjectId(
        schoolId
      ),
    });

  if (!teacher) {
    throw new ApiError(
      403,
      "Teacher not found"
    );
  }

  const assigned =
    teacher.assignments?.some(
      (a) =>
        a.classId?.toString() ===
          classId?.toString() &&
        a.subjectId?.toString() ===
          subjectId?.toString()
    );

  if (assigned) {
    return true;
  }

  const legacy =
    teacher.classIds?.some(
      (id) =>
        id.toString() ===
        classId?.toString()
    ) &&
    teacher.subjectIds?.some(
      (id) =>
        id.toString() ===
        subjectId?.toString()
    );

  if (legacy) {
    return true;
  }

  throw new ApiError(
    403,
    "You are not assigned to this subject"
  );
}

/* =========================================
   UPSERT (SINGLE RESULT)
========================================= */

/* =========================================
   SHARED ASSESSMENT SAVE HELPERS
========================================= */

function getScoresFromPayload(payload = {}) {
  // Prefer the new dynamic format when supplied.
  if (
    payload.scores &&
    typeof payload.scores === "object" &&
    !Array.isArray(payload.scores)
  ) {
    return payload.scores;
  }

  // Backward compatibility with existing teacher entry.
  return {
    ca1: payload.ca1,
    ca2: payload.ca2,
    assignment: payload.assignment,
    exam: payload.exam,
  };
}

function getSchemeSnapshot(calculated) {
  return {
    version: calculated.assessmentScheme.version,
    totalMax: calculated.assessmentScheme.totalMax,
    components: calculated.assessmentScheme.components,
  };
}

async function calculateForClass({
  user,
  schoolId,
  classId,
  payload,
  gradeBands,
}) {
  const resolved = await getResultScheme(user, { classId });

  const calculated = calculateDynamicResultFields({
    scores: getScoresFromPayload(payload),
    scheme: resolved.scheme,
    gradeBands,
  });

  return {
    ...calculated,
    // Keep a numeric total for compatibility with existing reports.
    total: calculated.total ?? 0,
    assessmentScheme: getSchemeSnapshot(calculated),
  };
}

async function ensureResultsEditable({
  schoolId,
  classId,
  subjectId,
  sessionId,
  termId,
  studentIds,
}) {
  if (!studentIds.length) {
    throw new ApiError(400, "At least one student result is required.");
  }

  const existing = await Result.find({
    schoolId,
    classId,
    subjectId,
    sessionId,
    termId,
    studentId: { $in: studentIds },
    status: { $in: ["published", "locked"] },
  })
    .select("studentId status")
    .lean();

  if (existing.length) {
    const locked = existing.filter(
      (result) => result.status === "locked"
    );

    if (locked.length) {
      throw new ApiError(
        400,
        "Some results are locked and cannot be modified."
      );
    }

    throw new ApiError(
      400,
      "Some results are already published. Unpublish them through an authorized workflow before editing."
    );
  }
}

/* =========================================
   UPSERT SINGLE RESULT
========================================= */

export async function createOrUpdateResult(payload, user) {
  if (!user?.schoolId) {
    throw new ApiError(401, "School context is required.");
  }

  const schoolId = user.schoolId;

  const requiredFields = [
    "studentId",
    "classId",
    "subjectId",
    "sessionId",
    "termId",
  ];

  for (const field of requiredFields) {
    if (!payload?.[field]) {
      throw new ApiError(400, `${field} is required.`);
    }
  }

  await validateResultAcademicPeriod({
    schoolId,
    sessionId: payload.sessionId,
    termId: payload.termId,
  });

  await ensureTeacherCanEnter({
    user,
    schoolId,
    classId: payload.classId,
    subjectId: payload.subjectId,
  });

  const gradeBands = await getSchoolGradeBands(schoolId);

  const computed = await calculateForClass({
    user,
    schoolId,
    classId: payload.classId,
    payload,
    gradeBands,
  });

  await ensureResultsEditable({
    schoolId,
    classId: payload.classId,
    subjectId: payload.subjectId,
    sessionId: payload.sessionId,
    termId: payload.termId,
    studentIds: [payload.studentId],
  });

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

        ca1: computed.ca1,
        ca2: computed.ca2,
        assignment: computed.assignment,
        exam: computed.exam,

        scores: computed.scores,
        assessmentScheme: computed.assessmentScheme,

        total: computed.total,
        grade: computed.grade,
        remark: computed.remark,

        status: "draft",
        enteredBy: user._id || user.id,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
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
   BULK UPSERT (TEACHER ENTRY)
========================================= */

export async function bulkUpsertResults({
  schoolId,
  classId,
  subjectId,
  sessionId,
  termId,
  results,
  user,
}) {
  if (!user) {
    throw new ApiError(401, "User not authenticated.");
  }

  if (!Array.isArray(results) || results.length === 0) {
    throw new ApiError(400, "At least one result is required.");
  }

  await validateResultAcademicPeriod({
    schoolId,
    sessionId,
    termId,
  });

  await ensureTeacherCanEnter({
    user,
    schoolId,
    classId,
    subjectId,
  });

  const studentIds = results.map((result) => result.studentId);

  if (
    studentIds.some(
      (id) => !id || !mongoose.Types.ObjectId.isValid(id)
    )
  ) {
    throw new ApiError(400, "Every result must contain a valid studentId.");
  }

  if (new Set(studentIds.map(String)).size !== studentIds.length) {
    throw new ApiError(400, "Duplicate student results were submitted.");
  }

  await ensureResultsEditable({
    schoolId,
    classId,
    subjectId,
    sessionId,
    termId,
    studentIds,
  });

  const gradeBands = await getSchoolGradeBands(schoolId);

  const operations = [];

  for (const row of results) {
    const computed = await calculateForClass({
      user,
      schoolId,
      classId,
      payload: row,
      gradeBands,
    });

    operations.push({
      updateOne: {
        filter: {
          schoolId,
          studentId: row.studentId,
          classId,
          subjectId,
          sessionId,
          termId,
          // Never update a published or locked result, even if
          // its status changes between the earlier check and write.
          status: { $nin: ["published", "locked"] },
        },
        update: {
          $set: {
            schoolId,
            studentId: row.studentId,
            classId,
            subjectId,
            sessionId,
            termId,

            ca1: computed.ca1,
            ca2: computed.ca2,
            assignment: computed.assignment,
            exam: computed.exam,

            scores: computed.scores,
            assessmentScheme: computed.assessmentScheme,

            total: computed.total,
            grade: computed.grade,
            remark: computed.remark,

            status: "draft",
            enteredBy: user._id || user.id,
          },
          $setOnInsert: {
            // No extra fields needed here; kept for future
            // insert-only defaults if required.
          },
        },
        upsert: true,
      },
    });
  }

  const writeResult = await Result.bulkWrite(operations, {
    ordered: true,
  });

  return {
    success: true,
    matched: writeResult.matchedCount,
    modified: writeResult.modifiedCount,
    upserted: writeResult.upsertedCount,
  };
}
/* =========================================
   GENERATE CLASS RESULTS
========================================= */

/* =========================================
   GENERATE CLASS RESULTS
========================================= */

export async function generateClassResults({
  schoolId,
  classId,
  sessionId,
  termId,
}) {
  console.log("GENERATE START", {
    schoolId,
    classId,
    sessionId,
    termId,
  });

  /* =========================================
     BLOCK LOCKED RESULTS
  ========================================= */

  const lockedCount =
    await Result.countDocuments({
      schoolId,
      classId,
      sessionId,
      termId,
      status: "locked",
    });

  console.log(
    "LOCKED RESULTS FOUND:",
    lockedCount
  );

  if (lockedCount > 0) {
    throw new ApiError(
      400,
      "Locked results cannot be regenerated. Unlock them first."
    );
  }

  /* =========================================
     LOAD RESULTS
  ========================================= */

  const results =
    await Result.find({
      schoolId,
      classId,
      sessionId,
      termId,
    });

  console.log(
    "RESULTS FOUND:",
    results.length
  );

  
let updated = 0;
const gradeBands = await getSchoolGradeBands(schoolId);

for (const r of results) {
  // Preserve the assessment scheme originally used for this result.
  const hasSavedScheme =
    Array.isArray(r.assessmentScheme?.components) &&
    r.assessmentScheme.components.length > 0;

  const savedScores =
    r.scores instanceof Map
      ? Object.fromEntries(r.scores.entries())
      : r.scores && typeof r.scores === "object"
        ? { ...r.scores }
        : {};

  // Legacy records may not contain dynamic scores yet.
  const hasDynamicScores = Object.keys(savedScores).length > 0;

  const scores = hasDynamicScores
    ? savedScores
    : {
        ca1: r.ca1,
        ca2: r.ca2,
        assignment: r.assignment,
        exam: r.exam,
      };

  const computed = calculateDynamicResultFields({
    scores,
    scheme: hasSavedScheme ? r.assessmentScheme : null,
    gradeBands,
  });

  r.scores = computed.scores;

  // Keep legacy fields for existing reports and integrations.
  for (const key of ["ca1", "ca2", "assignment", "exam"]) {
    if (computed[key] !== undefined) {
      r[key] = computed[key];
    }
  }

  r.total = computed.total ?? 0;
  r.grade = computed.grade;
  r.remark = computed.remark;
  r.status = "generated";

  await r.save();
  updated++;
}

  console.log(
    "GENERATED RESULTS:",
    updated
  );

  return {
    success: true,
    generated: updated,
  };
}

/* =========================================
   PUBLISH RESULTS
========================================= */

export async function publishClassResults({
  schoolId,
  classId,
  sessionId,
  termId,
}) {
  console.log("PUBLISH START", {
    schoolId,
    classId,
    sessionId,
    termId,
  });

  /* =========================================
     BLOCK LOCKED RESULTS
  ========================================= */

  const lockedCount =
    await Result.countDocuments({
      schoolId,
      classId,
      sessionId,
      termId,
      status: "locked",
    });

  console.log(
    "LOCKED RESULTS FOUND:",
    lockedCount
  );

  if (lockedCount > 0) {
    throw new ApiError(
      400,
      "Locked results cannot be published. Unlock them first."
    );
  }

  /* =========================================
     ONLY PUBLISH GENERATED RESULTS
  ========================================= */

  const filter = {
    schoolId,
    classId,
    sessionId,
    termId,
    status: "generated",
  };

  console.log(
    "PUBLISH FILTER:",
    filter
  );

  const beforeCount =
    await Result.countDocuments(
      filter
    );

  console.log(
    "GENERATED RESULTS FOUND:",
    beforeCount
  );

  const res =
    await Result.updateMany(
      filter,
      {
        $set: {
          status: "published",
        },
      }
    );

  console.log(
    "PUBLISHED RESULTS UPDATED:",
    res.modifiedCount
  );

  const afterCount =
    await Result.countDocuments({
      schoolId,
      classId,
      sessionId,
      termId,
      status: "published",
    });

  console.log(
    "TOTAL PUBLISHED RESULTS:",
    afterCount
  );

  return {
    success: true,
    found: beforeCount,
    updated: res.modifiedCount,
    published: afterCount,
  };
}

/* =========================================
   LOCK / UNLOCK
========================================= */

export async function lockClassResults(
  params
) {
  const res =
    await Result.updateMany(
      params,
      {
        $set: {
          status: "locked",
        },
      }
    );

  return {
    success: true,
    updated: res.modifiedCount,
  };
}

export async function unlockClassResults(
  params
) {
  const res =
    await Result.updateMany(
      params,
      {
        $set: {
          status: "published",
        },
      }
    );

  return {
    success: true,
    updated: res.modifiedCount,
  };
}

/* =========================================
   ADMIN SUMMARY (PROGRESS ENGINE FIXED)
========================================= */

export async function getAdminResultSummary({
  schoolId,
  sessionId,
  termId,
}) {
  const match = {
    schoolId:
      new mongoose.Types.ObjectId(
        schoolId
      ),
  };

  if (sessionId) {
    match.sessionId =
      new mongoose.Types.ObjectId(
        sessionId
      );
  }

  if (termId) {
    match.termId =
      new mongoose.Types.ObjectId(
        termId
      );
  }

  const summary =
    await Result.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: {
            classId: "$classId",

            status: {
              $ifNull: [
                "$status",
                "draft",
              ],
            },
          },

          total: {
            $sum: 1,
          },
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

      {
        $unwind: {
          path: "$class",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,

          classId: "$_id.classId",
          className: "$class.name",

          status: {
            $toLower: "$_id.status",
          },

          total: 1,
        },
      },
    ]);

  console.log(
    "RESULT SUMMARY RAW:",
    JSON.stringify(
      summary,
      null,
      2
    )
  );

  const grouped = {};

  for (const item of summary) {
    const key =
      item.classId?.toString() ||
      "unknown";

    if (!grouped[key]) {
      grouped[key] = {
        classId: item.classId,

        className:
          item.className ||
          "Unknown Class",

        draft: 0,
        generated: 0,
        published: 0,
        locked: 0,

        totalResults: 0,
      };
    }

    const status =
      item.status || "draft";

    if (
      ![
        "draft",
        "generated",
        "published",
        "locked",
      ].includes(status)
    ) {
      console.warn(
        `Unknown status "${status}" found`
      );

      grouped[key].draft +=
        item.total;
    } else {
      grouped[key][status] =
        item.total;
    }

    grouped[key].totalResults +=
      item.total;
  }

  const result =
    Object.values(grouped).map(
      (item) => {
        const completed =
          item.generated +
          item.published +
          item.locked;

        return {
          ...item,

          progress:
            item.totalResults > 0
              ? Math.round(
                  (completed /
                    item.totalResults) *
                    100
                )
              : 0,
        };
      }
    );

  console.log(
    "RESULT SUMMARY FINAL:",
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}

/* =========================================
   LIST RESULTS
========================================= */

export async function listResults(
  query,
  user
) {
  const filter = {
    schoolId: user.schoolId,
  };

  if (query.classId)
    filter.classId =
      query.classId;

  if (query.studentId)
    filter.studentId =
      query.studentId;

  if (query.subjectId)
    filter.subjectId =
      query.subjectId;

  if (query.sessionId)
    filter.sessionId =
      query.sessionId;

  if (query.termId)
    filter.termId =
      query.termId;

  const results =
    await Result.find(filter)
      .populate(
        "studentId",
        "firstName lastName admissionNumber"
      )
      .populate("classId", "name")
      .populate(
        "subjectId",
        "name code"
      )
      .populate(
        "sessionId",
        "name"
      )
      .populate(
        "termId",
        "name"
      )
      .populate(
        "enteredBy",
        "firstName lastName"
      )
      .sort({
        createdAt: -1,
      });

  return results.map(
    formatResult
  );
}

/* =========================================
   STUDENT RESULTS
========================================= */

export async function getStudentResults(
  studentId,
  user
) {
  if (user.role === "parent") {
    await ensureParentOwnsStudent(
      user,
      studentId
    );
  }

  const results =
    await Result.find({
      schoolId: user.schoolId,
      studentId,
    })
      .populate(
        "subjectId",
        "name code"
      )
      .populate(
        "classId",
        "name"
      )
      .populate(
        "sessionId",
        "name"
      )
      .populate(
        "termId",
        "name"
      )
      .populate(
        "enteredBy",
        "firstName lastName"
      )
      .sort({
        createdAt: -1,
      });

  return results.map(
    formatResult
  );
}

/* =========================================
   ADMIN OVERVIEW
========================================= */

export async function getAdminResultsOverview({
  schoolId,
  sessionId,
  termId,
}) {
  const filter = {
    schoolId,
  };

  if (sessionId)
    filter.sessionId =
      sessionId;

  if (termId)
    filter.termId =
      termId;

  const results =
    await Result.find(filter);

  const totalResults =
    results.length;

  const totalStudents =
    new Set(
      results.map((r) =>
        String(r.studentId)
      )
    ).size;

  const publishedResults =
    results.filter(
      (r) =>
        r.status === "published"
    ).length;

  const lockedResults =
    results.filter(
      (r) =>
        r.status === "locked"
    ).length;

  const averageScore =
    totalResults > 0
      ? (
          results.reduce(
            (sum, r) =>
              sum +
              (r.total || 0),
            0
          ) / totalResults
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
