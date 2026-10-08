import { SubjectModel } from "./subject.model.js";
import { ClassModel } from "../classes/class.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/apiError.js";

async function validateClassIds(classIds, schoolId) {
  if (!classIds?.length) return;

  const count = await ClassModel.countDocuments({
    _id: { $in: classIds },
    schoolId,
  });

  if (count !== classIds.length) {
    throw new ApiError(
      400,
      "One or more selected classes are invalid"
    );
  }
}

async function validateTeacherIds(teacherIds, schoolId) {
  if (!teacherIds?.length) return;

  const count = await User.countDocuments({
    _id: { $in: teacherIds },
    schoolId,
    role: "teacher",
  });

  if (count !== teacherIds.length) {
    throw new ApiError(
      400,
      "One or more selected teachers are invalid"
    );
  }
}

/* =========================================
   CREATE SUBJECT
========================================= */

export async function createSubject(
  payload,
  schoolId
) {
  const exists = await SubjectModel.findOne({
    schoolId,
    name: payload.name,
  });

  if (exists) {
    throw new ApiError(
      400,
      "Subject already exists for this school"
    );
  }

  await validateClassIds(
    payload.classIds,
    schoolId
  );

  await validateTeacherIds(
    payload.teacherIds,
    schoolId
  );

  const data =
    await SubjectModel.create({
      schoolId,
      name: payload.name,
      code: payload.code || "",
      description:
        payload.description || "",
      category:
        payload.category || "general",
      isCore:
        payload.isCore ?? false,
      classIds:
        payload.classIds || [],
      teacherIds:
        payload.teacherIds || [],
      isActive:
        payload.isActive ?? true,
    });

  return data;
}

/* =========================================
   BULK CREATE SUBJECTS
========================================= */

export async function bulkCreateSubjects(
  rows,
  schoolId
) {
  const result = {
    summary: {
      total: rows.length,
      created: 0,
      failed: 0,
      skipped: 0,
    },

    errors: [],

    createdSubjects: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const payload = rows[i];

    try {
      const name =
        String(payload.name || "")
          .trim();

      if (!name) {
        result.summary.failed++;

        result.errors.push({
          index: i,
          error: "Subject name is required",
          row: payload,
        });

        continue;
      }

      const existing =
        await SubjectModel.findOne({
          schoolId,
          name,
        });

      if (existing) {
        result.summary.skipped++;

        result.errors.push({
          index: i,
          name,
          error:
            "Subject already exists for this school",
        });

        continue;
      }

      await validateClassIds(
        payload.classIds,
        schoolId
      );

      await validateTeacherIds(
        payload.teacherIds,
        schoolId
      );

      const subject =
        await SubjectModel.create({
          schoolId,

          name,

          code:
            payload.code
              ? String(payload.code)
                  .trim()
                  .toUpperCase()
              : "",

          description:
            payload.description || "",

          category:
            payload.category ||
            "general",

          isCore:
            payload.isCore ?? false,

          classIds:
            payload.classIds || [],

          teacherIds:
            payload.teacherIds || [],

          isActive:
            payload.isActive ?? true,
        });

      result.summary.created++;

      result.createdSubjects.push({
        index: i,
        subjectId: subject._id,
        name: subject.name,
        code: subject.code,
        status: "created",
      });
    } catch (error) {
      result.summary.failed++;

      result.errors.push({
        index: i,
        error:
          error?.message ||
          "Failed to create subject",
        row: payload,
      });
    }
  }

  return result;
}

/* =========================================
   LIST SUBJECTS
========================================= */

export async function listSubjects(
  schoolId
) {
  return SubjectModel.find({
    schoolId,
  })
    .populate(
      "classIds",
      "name level"
    )
    .populate(
      "teacherIds",
      "firstName lastName email"
    )
    .sort({
      createdAt: -1,
    });
}

/* =========================================
   GET SUBJECT
========================================= */

export async function getSubjectById(
  id,
  schoolId
) {
  const data =
    await SubjectModel.findOne({
      _id: id,
      schoolId,
    })
      .populate(
        "classIds",
        "name level"
      )
      .populate(
        "teacherIds",
        "firstName lastName email"
      );

  if (!data) {
    throw new ApiError(
      404,
      "Subject not found"
    );
  }

  return data;
}

/* =========================================
   UPDATE SUBJECT
========================================= */

export async function updateSubject(
  id,
  payload,
  schoolId
) {
  const data =
    await SubjectModel.findOne({
      _id: id,
      schoolId,
    });

  if (!data) {
    throw new ApiError(
      404,
      "Subject not found"
    );
  }

  if (
    payload.name &&
    payload.name !== data.name
  ) {
    const exists =
      await SubjectModel.findOne({
        schoolId,
        name: payload.name,
        _id: {
          $ne: id,
        },
      });

    if (exists) {
      throw new ApiError(
        400,
        "Another subject with this name already exists"
      );
    }
  }

  if (
    payload.classIds !== undefined
  ) {
    await validateClassIds(
      payload.classIds,
      schoolId
    );

    data.classIds =
      payload.classIds;
  }

  if (
    payload.teacherIds !== undefined
  ) {
    await validateTeacherIds(
      payload.teacherIds,
      schoolId
    );

    data.teacherIds =
      payload.teacherIds;
  }

  if (payload.name !== undefined) {
    data.name = payload.name;
  }

  if (payload.code !== undefined) {
    data.code = payload.code;
  }

  if (
    payload.description !== undefined
  ) {
    data.description =
      payload.description;
  }

  if (
    payload.category !== undefined
  ) {
    data.category =
      payload.category;
  }

  if (
    payload.isCore !== undefined
  ) {
    data.isCore =
      payload.isCore;
  }

  if (
    payload.isActive !== undefined
  ) {
    data.isActive =
      payload.isActive;
  }

  await data.save();

  return data;
}

/* =========================================
   DELETE SUBJECT
========================================= */

export async function deleteSubject(
  id,
  schoolId
) {
  const data =
    await SubjectModel.findOneAndDelete({
      _id: id,
      schoolId,
    });

  if (!data) {
    throw new ApiError(
      404,
      "Subject not found"
    );
  }

  return data;
}
