import {
  createSubjectSchema,
  updateSubjectSchema,
  bulkCreateSubjectSchema,
} from "./subject.validation.js";

import {
  createSubject,
  bulkCreateSubjects,
  deleteSubject,
  getSubjectById,
  listSubjects,
  updateSubject,
} from "./subject.service.js";

/* =========================================
   CREATE
========================================= */

export async function createSubjectHandler(
  req,
  res
) {
  const parsed =
    createSubjectSchema.parse(
      req.body
    );

  const data =
    await createSubject(
      parsed,
      req.user.schoolId
    );

  res.status(201).json({
    success: true,
    message:
      "Subject created successfully",
    data,
  });
}

/* =========================================
   BULK CREATE
========================================= */

export async function bulkCreateSubjectsHandler(
  req,
  res
) {
  const parsed =
    bulkCreateSubjectSchema.parse(
      req.body
    );

  const result =
    await bulkCreateSubjects(
      parsed.subjects,
      req.user.schoolId
    );

  res.status(201).json({
    success: true,
    message:
      "Bulk subject creation completed",
    data: result,
  });
}

/* =========================================
   LIST
========================================= */

export async function listSubjectsHandler(
  req,
  res
) {
  const data =
    await listSubjects(
      req.user.schoolId
    );

  res.json({
    success: true,
    message:
      "Subjects fetched successfully",
    data,
  });
}

/* =========================================
   GET
========================================= */

export async function getSubjectHandler(
  req,
  res
) {
  const data =
    await getSubjectById(
      req.params.id,
      req.user.schoolId
    );

  res.json({
    success: true,
    message:
      "Subject fetched successfully",
    data,
  });
}

/* =========================================
   UPDATE
========================================= */

export async function updateSubjectHandler(
  req,
  res
) {
  const parsed =
    updateSubjectSchema.parse(
      req.body
    );

  const data =
    await updateSubject(
      req.params.id,
      parsed,
      req.user.schoolId
    );

  res.json({
    success: true,
    message:
      "Subject updated successfully",
    data,
  });
}

/* =========================================
   DELETE
========================================= */

export async function deleteSubjectHandler(
  req,
  res
) {
  const data =
    await deleteSubject(
      req.params.id,
      req.user.schoolId
    );

  res.json({
    success: true,
    message:
      "Subject deleted successfully",
    data,
  });
}
