import {
  createTimetableRequirementSchema,
  updateTimetableRequirementSchema,
  bulkTimetableRequirementSchema,
} from "./timetable-requirement.validation.js";

import {
  createTimetableRequirement,
  listTimetableRequirements,
  getTimetableRequirementById,
  updateTimetableRequirement,
  deleteTimetableRequirement,
  bulkCreateTimetableRequirements,
} from "./timetable-requirement.service.js";

/*
=========================================
CREATE REQUIREMENT
=========================================
*/

export async function createTimetableRequirementHandler(
  req,
  res
) {
  const parsed =
    createTimetableRequirementSchema.parse(
      req.body
    );

  const data =
    await createTimetableRequirement(
      parsed,
      req.user.schoolId
    );

  res.status(201).json({
    success: true,
    message:
      "Timetable requirement created successfully",
    data,
  });
}

/*
=========================================
LIST REQUIREMENTS
=========================================
*/

export async function listTimetableRequirementsHandler(
  req,
  res
) {
  const data =
    await listTimetableRequirements(
      req.user.schoolId,
      {
        sessionId: req.query.sessionId,
        termId: req.query.termId,
        classId: req.query.classId,
        subjectId: req.query.subjectId,
        teacherId: req.query.teacherId,

        isActive:
          req.query.isActive ===
          undefined
            ? undefined
            : req.query.isActive ===
              "true",
      }
    );

  res.status(200).json({
    success: true,
    data,
  });
}

/*
=========================================
GET ONE REQUIREMENT
=========================================
*/

export async function getTimetableRequirementHandler(
  req,
  res
) {
  const data =
    await getTimetableRequirementById(
      req.params.id,
      req.user.schoolId
    );

  res.status(200).json({
    success: true,
    data,
  });
}

/*
=========================================
UPDATE REQUIREMENT
=========================================
*/

export async function updateTimetableRequirementHandler(
  req,
  res
) {
  const parsed =
    updateTimetableRequirementSchema.parse(
      req.body
    );

  const data =
    await updateTimetableRequirement(
      req.params.id,
      parsed,
      req.user.schoolId
    );

  res.status(200).json({
    success: true,
    message:
      "Timetable requirement updated successfully",
    data,
  });
}

/*
=========================================
DELETE REQUIREMENT
=========================================
*/

export async function deleteTimetableRequirementHandler(
  req,
  res
) {
  await deleteTimetableRequirement(
    req.params.id,
    req.user.schoolId
  );

  res.status(200).json({
    success: true,
    message:
      "Timetable requirement deleted successfully",
  });
}

/*
=========================================
BULK CREATE REQUIREMENTS
=========================================
*/

export async function bulkCreateTimetableRequirementsHandler(
  req,
  res
) {
  const parsed =
    bulkTimetableRequirementSchema.parse(
      req.body
    );

  const data =
    await bulkCreateTimetableRequirements(
      parsed.requirements,
      req.user.schoolId
    );

  res.status(201).json({
    success: true,
    message:
      "Bulk timetable requirement creation completed",
    data,
  });
}
