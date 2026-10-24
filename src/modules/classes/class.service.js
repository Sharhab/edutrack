import { ClassModel } from "./class.model.js";
import { User } from "../users/user.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ApiError } from "../../utils/apiError.js";


/**
 * Generate a URL-friendly class slug.
 */
function generateSlug(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Resolve the school's current academic context.
 *
 * A current term must belong to the current session.
 * Existing class records are never changed by this helper.
 */
async function getCurrentAcademicContext(schoolId) {
  const currentSessions = await Session.find({
    schoolId,
    isCurrent: true,
  }).select("_id name");

  if (currentSessions.length > 1) {
    throw new ApiError(
      409,
      "Multiple current academic sessions found. Correct the school's academic settings first."
    );
  }

  if (currentSessions.length === 0) {
    const currentTerms = await Term.countDocuments({
      schoolId,
      isCurrent: true,
    });

    if (currentTerms > 0) {
      throw new ApiError(
        409,
        "A current term exists without a current session. Correct the school's academic settings first."
      );
    }

    return {
      currentSession: null,
      currentTerm: null,
    };
  }

  const currentSession = currentSessions[0];

  const currentTerms = await Term.find({
    schoolId,
    sessionId: currentSession._id,
    isCurrent: true,
  }).select("_id name");

  if (currentTerms.length > 1) {
    throw new ApiError(
      409,
      "Multiple current terms found for the current session. Correct the school's academic settings first."
    );
  }

  // Detect a current term incorrectly attached to another session.
  const misplacedCurrentTerm = await Term.exists({
    schoolId,
    isCurrent: true,
    sessionId: { $ne: currentSession._id },
  });

  if (misplacedCurrentTerm) {
    throw new ApiError(
      409,
      "The current term does not belong to the current session. Correct the school's academic settings first."
    );
  }

  return {
    currentSession,
    currentTerm: currentTerms[0] || null,
  };
}

/**
 * Validate that a class teacher belongs to this school.
 */
async function validateClassTeacher(classTeacherId, schoolId) {
  if (!classTeacherId) return null;

  const teacher = await User.findOne({
    _id: classTeacherId,
    schoolId,
    role: "teacher",
  });

  if (!teacher) {
    throw new ApiError(
      404,
      "Selected class teacher not found in this school"
    );
  }

  return teacher;
}

/**
 * CREATE CLASS
 */
/**

* CREATE CLASS
  */
  export async function createClass(payload, schoolId) {
  const name = String(payload.name || "").trim();

if (!schoolId) {
throw new ApiError(400, "School context is required");
}

if (name.length < 2) {
throw new ApiError(
400,
"Class name must contain at least 2 characters"
);
}

// Prevent duplicate class names within this school.
const normalizedName = name.toLowerCase();

const existingClasses = await ClassModel.find({
schoolId,
}).select("_id name");

const duplicate = existingClasses.some(
(item) => item.name.trim().toLowerCase() === normalizedName
);

if (duplicate) {
throw new ApiError(
409,
"A class with this name already exists in your school"
);
}

const classTeacherId = payload.classTeacherId || null;

if (classTeacherId) {
await validateClassTeacher(classTeacherId, schoolId);
}

const { currentSession, currentTerm } =
await getCurrentAcademicContext(schoolId);

const data = await ClassModel.create({
schoolId,
sessionId: currentSession?._id || null,
termId: currentTerm?._id || null,


name,
slug: generateSlug(name),
level: payload.level || "",
code: payload.code || "",
classTeacherId,
capacity: payload.capacity ?? 40,
isActive: payload.isActive ?? true,


});

return data;
}

/**
 * LIST CLASSES
 */
export async function listClasses(schoolId) {
  return ClassModel.find({ schoolId })
    .populate("classTeacherId", "firstName lastName email")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .sort({ createdAt: -1 });
}

/**
 * GET CLASS
 */
export async function getClassById(id, schoolId) {
  const data = await ClassModel.findOne({
    _id: id,
    schoolId,
  })
    .populate("classTeacherId", "firstName lastName email")
    .populate("sessionId", "name")
    .populate("termId", "name");

  if (!data) {
    throw new ApiError(404, "Class not found");
  }

  return data;
}

/**
 * UPDATE CLASS
 *
 * Academic period fields are intentionally not changed here.
 */
export async function updateClass(id, payload, schoolId) {
  const data = await ClassModel.findOne({
    _id: id,
    schoolId,
  });

  if (!data) {
    throw new ApiError(404, "Class not found");
  }

  if (payload.name !== undefined) {
    const name = String(payload.name || "").trim();

    if (!name) {
      throw new ApiError(400, "Class name is required");
    }

    if (name !== data.name) {
      const exists = await ClassModel.findOne({
        schoolId,
        name,
        _id: { $ne: id },
      });

      if (exists) {
        throw new ApiError(
          400,
          "Another class with this name already exists"
        );
      }
    }

    data.name = name;
    data.slug = generateSlug(name);
  }

  if (payload.classTeacherId) {
    await validateClassTeacher(payload.classTeacherId, schoolId);
    data.classTeacherId = payload.classTeacherId;
  } else if (payload.classTeacherId === null) {
    data.classTeacherId = null;
  }

  if (payload.level !== undefined) {
    data.level = payload.level;
  }

  if (payload.capacity !== undefined) {
    data.capacity = payload.capacity;
  }
 
  if (payload.code !== undefined) {
    data.code = payload.code;
  }

  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }
  await data.save();

  return data;
}

/**
 * DELETE CLASS
 */
export async function deleteClass(id, schoolId) {
  const data = await ClassModel.findOneAndDelete({
    _id: id,
    schoolId,
  });

  if (!data) {
    throw new ApiError(404, "Class not found");
  }

  return data;
}

/**
 * BULK CREATE / UPDATE CLASSES
 *
 * Existing classes keep their existing sessionId and termId.
 * Only newly created classes receive the current academic context.
 */
export async function bulkUpsertClasses(rows, schoolId) {
  if (!Array.isArray(rows)) {
    throw new ApiError(400, "Classes must be provided as an array");
  }

  let created = 0;
  let updated = 0;
  let failed = 0;

  const results = [];

  // Resolve once for the entire import.
  const { currentSession, currentTerm } =
    await getCurrentAcademicContext(schoolId);

  for (const row of rows) {
    try {
      const className = String(row?.name || "").trim();

      if (!className) {
        failed++;

        results.push({
          name: row?.name || "",
          action: "failed",
          error: "Class name is required",
        });

        continue;
      }

      if (row.classTeacherId) {
        await validateClassTeacher(row.classTeacherId, schoolId);
      }

      const existing = await ClassModel.findOne({
        schoolId,
        name: className,
      });

      if (existing) {
        if (row.level !== undefined) {
          existing.level = row.level;
        }

        if (row.code !== undefined) {
          existing.code = row.code;
        }

        if (row.capacity !== undefined) {
          existing.capacity = Number(row.capacity) || 0;
        }

        if (row.classTeacherId !== undefined) {
          existing.classTeacherId = row.classTeacherId || null;
        }

        if (row.isActive !== undefined) {
          existing.isActive = Boolean(row.isActive);
        }

        // Do not change existing.sessionId or existing.termId.
        await existing.save();

        updated++;

        results.push({
          name: className,
          action: "updated",
          classId: existing._id,
        });

        continue;
      }

      const createdClass = await ClassModel.create({
        schoolId,
        sessionId: currentSession?._id || null,
        termId: currentTerm?._id || null,
        name: className,
        slug: generateSlug(className),
        level: row.level || "primary",
        code: row.code || "",
        classTeacherId: row.classTeacherId || null,
        capacity: Number(row.capacity) || 40,
        isActive: row.isActive ?? true,
      });

      created++;

      results.push({
        name: className,
        action: "created",
        classId: createdClass._id,
      });
    } catch (error) {
      failed++;

      results.push({
        name: row?.name || "",
        action: "failed",
        error: error?.message || "Unknown error",
      });
    }
  }

  return {
    total: rows.length,
    created,
    updated,
    failed,
    sessionId: currentSession?._id || null,
    termId: currentTerm?._id || null,
    results,
  };
}
