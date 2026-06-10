import {
  createTeacherSchema,
  updateTeacherSchema,
} from "./teacher.validation.js";

import {
  createTeacher,
  deleteTeacher,
  getTeacherById,
  listTeachers,
  updateTeacher,
  bulkUpsertTeachers,
} from "./teacher.service.js";

/* =========================================
   CREATE TEACHER
========================================= */
export async function createTeacherHandler(
  req,
  res,
  next
) {
  try {
    const parsed =
      createTeacherSchema.parse(
        req.body
      );

    const data =
      await createTeacher(
        parsed,
        req.user.schoolId
      );

    res.status(201).json({
      success: true,

      message:
        "Teacher created successfully",

      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   LIST TEACHERS
========================================= */
export async function listTeachersHandler(
  req,
  res,
  next
) {
  try {
    const data =
      await listTeachers(
        req.user.schoolId
      );

    res.json({
      success: true,

      message:
        "Teachers fetched successfully",

      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   GET SINGLE TEACHER
========================================= */
export async function getTeacherHandler(
  req,
  res,
  next
) {
  try {
    const data =
      await getTeacherById(
        req.params.id,
        req.user.schoolId
      );

    res.json({
      success: true,

      message:
        "Teacher fetched successfully",

      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   UPDATE TEACHER
========================================= */
export async function updateTeacherHandler(
  req,
  res,
  next
) {
  try {
    const parsed =
      updateTeacherSchema.parse(
        req.body
      );

    const data =
      await updateTeacher(
        req.params.id,
        parsed,
        req.user.schoolId
      );

    res.json({
      success: true,

      message:
        "Teacher updated successfully",

      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   DELETE TEACHER
========================================= */
export async function deleteTeacherHandler(
  req,
  res,
  next
) {
  try {
    const data =
      await deleteTeacher(
        req.params.id,
        req.user.schoolId
      );

    res.json({
      success: true,

      message:
        "Teacher deleted successfully",

      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   BULK UPSERT TEACHERS
========================================= */
export async function bulkTeachersHandler(req, res, next) {
  try {
    const rows = req.body.rows; // 👈 MUST match frontend

    const data = await bulkUpsertTeachers(rows, req.user.schoolId);

    res.json({
      success: true,
      message: "Teachers processed successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}