import mongoose from "mongoose";
import { Result } from "./result.model.js";
import { computeGrade } from "./grade.utils.js";
import { ApiError } from "../../utils/apiError.js";

/* =========================================
   CORE UTILS (SINGLE SOURCE OF TRUTH)
========================================= */

function calculateResultFields(payload) {
  const ca1 = Number(payload.ca1 || 0);
  const ca2 = Number(payload.ca2 || 0);
  const assignment = Number(payload.assignment || 0);
  const exam = Number(payload.exam || 0);

  const total = ca1 + ca2 + assignment + exam;
  const { grade, remark } = computeGrade(total);

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
   TEACHER VALIDATION (STANDARDIZED)
========================================= */

export async function ensureTeacherCanEnter({
  user,
  schoolId,
  classId,
  subjectId,
}) {
  const userId = new mongoose.Types.ObjectId(
    user?.id || user?._id
  );

  const teacher = await mongoose.model("Teacher").findOne({
    userId,
    schoolId,
  });

  if (!teacher) {
    console.log("❌ Teacher not found", { userId, schoolId });

    throw new ApiError(403, "Teacher not found");
  }

  // PRIMARY: assignment mapping
  const hasAssignment = teacher.assignments?.some(
    (a) =>
      a.classId?.toString() === classId?.toString() &&
      a.subjectId?.toString() === subjectId?.toString()
  );

  if (hasAssignment) return true;

  // OPTIONAL LEGACY (can remove later)
  const legacyMatch = teacher.classIds?.some(
    (id) => id.toString() === classId?.toString()
  ) && teacher.subjectIds?.some(
    (id) => id.toString() === subjectId?.toString()
  );

  if (legacyMatch) return true;

  throw new ApiError(
    403,
    "You are not assigned to this class/subject"
  );
}
/* =========================================
   UPSERT (SINGLE RESULT)
========================================= */

export async function createOrUpdateResult(payload, user) {
  const schoolId = user.schoolId;

  const computed = calculateResultFields(payload);

  await ensureTeacherCanEnter({
    user,
    schoolId,
    classId: payload.classId,
    subjectId: payload.subjectId,
  });

  /* =========================================
     PREVENT EDITING LOCKED RESULTS
  ========================================= */

  const existingResult = await Result.findOne({
    schoolId,
    studentId: payload.studentId,
    subjectId: payload.subjectId,
    sessionId: payload.sessionId,
    termId: payload.termId,
  });

  if (existingResult?.status === "locked") {
    throw new ApiError(
      400,
      "This result is locked and cannot be modified"
    );
  }

  /* =========================================
     UPSERT RESULT
  ========================================= */

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

        ...computed,

        status: "draft",

        enteredBy: user._id || user.id,
      },
    },
    {
      new: true,
      upsert: true,
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
   BULK UPSERT (FAST ENTRY)
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
  if (!Array.isArray(results)) {
    throw new ApiError(400, "Results must be an array");
  }

  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  await ensureTeacherCanEnter({
    user,
    schoolId,
    classId,
    subjectId,
  });

  /* =========================================
   PREVENT UPDATING LOCKED RESULTS
========================================= */

const lockedResults = await Result.find({
  schoolId,
  subjectId,
  sessionId,
  termId,
  status: "locked",
  studentId: {
    $in: results.map((r) => r.studentId),
  },
});

if (lockedResults.length > 0) {
  const lockedStudents = lockedResults
    .map((r) => r.studentId.toString())
    .join(", ");

  throw new ApiError(
    400,
    `Some results are locked and cannot be modified. Students: ${lockedStudents}`
  );
}

/* =========================================
   BUILD BULK OPERATIONS
========================================= */

const operations = results.map((r) => {
  const computed = calculateResultFields(r);

  return {
    updateOne: {
      filter: {
        schoolId,
        studentId: r.studentId,
        subjectId,
        sessionId,
        termId,
      },
      update: {
        $set: {
          schoolId,
          studentId: r.studentId,
          classId,
          subjectId,
          sessionId,
          termId,

          ...computed,

          status: "draft",

          enteredBy: user._id,
        },
      },
      upsert: true,
    },
  };
});
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

  const lockedCount = await Result.countDocuments({
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

  const results = await Result.find({
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

  for (const r of results) {
    const computed =
      calculateResultFields(r);

    r.total = computed.total;
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

  const lockedCount = await Result.countDocuments({
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
    await Result.countDocuments(filter);

  console.log(
    "GENERATED RESULTS FOUND:",
    beforeCount
  );

  const res = await Result.updateMany(
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

export async function lockClassResults(params) {
  const res = await Result.updateMany(
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

export async function unlockClassResults(params) {
  const res = await Result.updateMany(
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
    schoolId: new mongoose.Types.ObjectId(schoolId),
  };

  if (sessionId) {
    match.sessionId = new mongoose.Types.ObjectId(sessionId);
  }

  if (termId) {
    match.termId = new mongoose.Types.ObjectId(termId);
  }

  const summary = await Result.aggregate([
    {
      $match: match,
    },

    {
      $group: {
        _id: {
          classId: "$classId",

          status: {
            $ifNull: ["$status", "draft"],
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
    JSON.stringify(summary, null, 2)
  );

  const grouped = {};

  for (const item of summary) {
    const key =
      item.classId?.toString() || "unknown";

    if (!grouped[key]) {
      grouped[key] = {
        classId: item.classId,

        className:
          item.className || "Unknown Class",

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

      grouped[key].draft += item.total;
    } else {
      grouped[key][status] = item.total;
    }

    grouped[key].totalResults += item.total;
  }

  const result = Object.values(grouped).map(
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
    JSON.stringify(result, null, 2)
  );

  return result;
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
    .populate("enteredBy", "firstName lastName")
    .sort({ createdAt: -1 });

  return results.map(formatResult);
}

/* =========================================
   STUDENT RESULTS
========================================= */

export async function getStudentResults(studentId, user) {
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
    .populate("enteredBy", "firstName lastName")
    .sort({ createdAt: -1 });

  return results.map(formatResult);
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

const publishedResults = results.filter((r) => r.status === "published").length;
const lockedResults = results.filter((r) => r.status === "locked").length;

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
