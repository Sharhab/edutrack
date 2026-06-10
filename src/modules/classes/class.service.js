import { ClassModel } from "./class.model.js";
import { User } from "../users/user.model.js";

import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";

import { ApiError } from "../../utils/apiError.js";

/**
 * =========================================
 * GENERATE SLUG
 * =========================================
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * =========================================
 * CREATE CLASS
 * =========================================
 */
export async function createClass(payload, schoolId) {
  /**
   * CHECK EXISTING CLASS
   */
  const exists = await ClassModel.findOne({
    schoolId,
    name: payload.name,
  });

  if (exists) {
    throw new ApiError(
      400,
      "Class already exists for this school"
    );
  }

  /**
   * VALIDATE CLASS TEACHER
   */
  if (payload.classTeacherId) {
    const teacher = await User.findOne({
      _id: payload.classTeacherId,
      schoolId,
      role: "teacher",
    });

    if (!teacher) {
      throw new ApiError(
        404,
        "Selected class teacher not found in this school"
      );
    }
  }

  /**
   * GET CURRENT SESSION
   */
  const currentSession = await Session.findOne({
    schoolId,
    isCurrent: true,
  });

  /**
   * GET CURRENT TERM
   */
  let currentTerm = null;

  if (currentSession) {
    currentTerm = await Term.findOne({
      schoolId,
      sessionId: currentSession._id,
      isCurrent: true,
    });
  }

  /**
   * CREATE CLASS
   */
  const data = await ClassModel.create({
    schoolId,

    sessionId: currentSession?._id || null,
    termId: currentTerm?._id || null,

    name: payload.name,

    slug: generateSlug(payload.name),

    level: payload.level || "primary",

    classTeacherId:
      payload.classTeacherId || null,

    capacity: payload.capacity || 40,

    isActive: true,
  });

  return data;
}

/**
 * =========================================
 * LIST CLASSES
 * =========================================
 */
export async function listClasses(schoolId) {

   const classes = await ClassModel.find({
    schoolId,
  });

  console.log(
    "FOUND CLASSES:",
    classes.length
  );

  return ClassModel.find({
    schoolId,
  })
    .populate(
      "classTeacherId",
      "firstName lastName email"
    )
    .populate("sessionId", "name")
    .populate("termId", "name")
    .sort({ createdAt: -1 });
}

/**
 * =========================================
 * GET CLASS
 * =========================================
 */
export async function getClassById(
  id,
  schoolId
) {
  const data = await ClassModel.findOne({
    _id: id,
    schoolId,
  })
    .populate(
      "classTeacherId",
      "firstName lastName email"
    )
    .populate("sessionId", "name")
    .populate("termId", "name");

  if (!data) {
    throw new ApiError(404, "Class not found");
  }

  return data;
}

/**
 * =========================================
 * UPDATE CLASS
 * =========================================
 */
export async function updateClass(
  id,
  payload,
  schoolId
) {
  const data = await ClassModel.findOne({
    _id: id,
    schoolId,
  });

  if (!data) {
    throw new ApiError(404, "Class not found");
  }

  /**
   * CHECK DUPLICATE NAME
   */
  if (
    payload.name &&
    payload.name !== data.name
  ) {
    const exists = await ClassModel.findOne({
      schoolId,
      name: payload.name,
      _id: { $ne: id },
    });

    if (exists) {
      throw new ApiError(
        400,
        "Another class with this name already exists"
      );
    }
  }

  /**
   * VALIDATE TEACHER
   */
  if (payload.classTeacherId) {
    const teacher = await User.findOne({
      _id: payload.classTeacherId,
      schoolId,
      role: "teacher",
    });

    if (!teacher) {
      throw new ApiError(
        404,
        "Selected class teacher not found in this school"
      );
    }
  }

  /**
   * REMOVE TEACHER
   */
  if (payload.classTeacherId === null) {
    data.classTeacherId = null;
  }

  /**
   * UPDATE VALUES
   */
  if (payload.name !== undefined) {
    data.name = payload.name;
    data.slug = generateSlug(payload.name);
  }

  if (payload.level !== undefined) {
    data.level = payload.level;
  }

  if (
    payload.classTeacherId !== undefined &&
    payload.classTeacherId !== null
  ) {
    data.classTeacherId =
      payload.classTeacherId;
  }

  if (payload.capacity !== undefined) {
    data.capacity = payload.capacity;
  }

  await data.save();

  return data;
}

/**
 * =========================================
 * DELETE CLASS
 * =========================================
 */
export async function deleteClass(
  id,
  schoolId
) {
  const data =
    await ClassModel.findOneAndDelete({
      _id: id,
      schoolId,
    });

  if (!data) {
    throw new ApiError(404, "Class not found");
  }

  return data;
}

export async function bulkUpsertClasses(
  rows,
  schoolId
) {
  let created = 0;
  let updated = 0;
  let failed = 0;

  const results = [];

  const currentSession =
    await Session.findOne({
      schoolId,
      isCurrent: true,
    });

  let currentTerm = null;

  if (currentSession) {
    currentTerm =
      await Term.findOne({
        schoolId,
        sessionId:
          currentSession._id,
        isCurrent: true,
      });
  }

  for (const row of rows) {
    try {
      const className =
        row.name?.trim();

      if (!className) {
        failed++;

        results.push({
          name: row.name || "",
          action: "failed",
          error:
            "Class name is required",
        });

        continue;
      }

      /**
       * OPTIONAL TEACHER VALIDATION
       */
      if (row.classTeacherId) {
        const teacher =
          await User.findOne({
            _id: row.classTeacherId,
            schoolId,
            role: "teacher",
          });

        if (!teacher) {
          throw new ApiError(
            404,
            `Teacher not found for class ${className}`
          );
        }
      }

      const existing =
        await ClassModel.findOne({
          schoolId,
          name: className,
        });

      /**
       * UPDATE EXISTING
       */
      if (existing) {
        if (
          row.level !== undefined
        ) {
          existing.level =
            row.level;
        }

        if (
          row.code !== undefined
        ) {
          existing.code =
            row.code;
        }

        if (
          row.capacity !==
          undefined
        ) {
          existing.capacity =
            Number(
              row.capacity
            ) || 0;
        }

        if (
          row.classTeacherId !==
          undefined
        ) {
          existing.classTeacherId =
            row.classTeacherId ||
            null;
        }

        if (
          row.isActive !==
          undefined
        ) {
          existing.isActive =
            Boolean(
              row.isActive
            );
        }

        await existing.save();

        updated++;

        results.push({
          name: className,
          action: "updated",
          classId:
            existing._id,
        });
      }

      /**
       * CREATE NEW
       */
      else {
        const createdClass =
          await ClassModel.create({
            schoolId,

            sessionId:
              currentSession?._id ||
              null,

            termId:
              currentTerm?._id ||
              null,

            name: className,

            slug:
              generateSlug(
                className
              ),

            level:
              row.level || "",

            code:
              row.code || "",

            classTeacherId:
              row.classTeacherId ||
              null,

            capacity:
              Number(
                row.capacity
              ) || 40,

            isActive:
              row.isActive ??
              true,
          });

        created++;

        results.push({
          name: className,
          action: "created",
          classId:
            createdClass._id,
        });
      }
    } catch (error) {
      failed++;

      results.push({
        name:
          row?.name || "",
        action: "failed",
        error:
          error?.message ||
          "Unknown error",
      });
    }
  }

  return {
    total: rows.length,

    created,
    updated,
    failed,

    sessionId:
      currentSession?._id ||
      null,

    termId:
      currentTerm?._id ||
      null,

    results,
  };
}
