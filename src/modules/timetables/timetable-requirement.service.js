import mongoose from "mongoose";

import { TimetableRequirement } from "./timetable-requirement.model.js";

import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import ClassModel from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import Teacher from "../teachers/teacher.model.js";

import { ApiError } from "../../utils/apiError.js";

/*
=========================================
VALIDATE OBJECT ID
=========================================
*/

function validateObjectId(id, name) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(
      400,
      `Invalid ${name} ID`
    );
  }
}

/*
=========================================
VALIDATE ACADEMIC PERIOD
=========================================
*/

async function validateAcademicPeriod(
  sessionId,
  termId,
  schoolId
) {
  validateObjectId(sessionId, "session");
  validateObjectId(termId, "term");

  const session = await Session.findOne({
    _id: sessionId,
    schoolId,
  });

  if (!session) {
    throw new ApiError(
      404,
      "Session not found"
    );
  }

  const term = await Term.findOne({
    _id: termId,
    sessionId,
    schoolId,
  });

  if (!term) {
    throw new ApiError(
      404,
      "Term not found for the selected session"
    );
  }

  return {
    session,
    term,
  };
}

/*
=========================================
VALIDATE CLASS
=========================================
*/

async function validateClass(
  classId,
  schoolId
) {
  validateObjectId(classId, "class");

  const classItem = await ClassModel.findOne({
    _id: classId,
    schoolId,
  });

  if (!classItem) {
    throw new ApiError(
      404,
      "Class not found"
    );
  }

  return classItem;
}

/*
=========================================
VALIDATE SUBJECT
=========================================
*/

async function validateSubject(
  subjectId,
  schoolId
) {
  validateObjectId(
    subjectId,
    "subject"
  );

  const subject =
    await SubjectModel.findOne({
      _id: subjectId,
      schoolId,
    });

  if (!subject) {
    throw new ApiError(
      404,
      "Subject not found"
    );
  }

  return subject;
}

/*
=========================================
VALIDATE TEACHER
=========================================
*/

async function validateTeacher(
  teacherId,
  schoolId
) {
  validateObjectId(
    teacherId,
    "teacher"
  );

  /*
   * Your Teacher model stores the actual
   * User account in userId.
   *
   * timetableRequirement.teacherId points
   * to User, so we validate against
   * Teacher.userId.
   */

  const teacher =
    await Teacher.findOne({
      userId: teacherId,
      schoolId,
    });

  if (!teacher) {
    throw new ApiError(
      404,
      "Teacher not found"
    );
  }

  return teacher;
}

/*
=========================================
VALIDATE RELATIONSHIPS
=========================================
*/

async function validateRequirementRelations(
  payload,
  schoolId
) {
  await validateAcademicPeriod(
    payload.sessionId,
    payload.termId,
    schoolId
  );

  const classItem =
    await validateClass(
      payload.classId,
      schoolId
    );

  const subject =
    await validateSubject(
      payload.subjectId,
      schoolId
    );

  const teacher =
    await validateTeacher(
      payload.teacherId,
      schoolId
    );

  /*
  =========================================
  CHECK SUBJECT ASSIGNMENT
  =========================================

  If the subject has teacherIds configured,
  make sure this teacher is assigned to it.
  */

  if (
    Array.isArray(subject.teacherIds) &&
    subject.teacherIds.length > 0
  ) {
    const assigned =
      subject.teacherIds.some(
        (id) =>
          id.toString() ===
          payload.teacherId.toString()
      );

    if (!assigned) {
      throw new ApiError(
        400,
        "Selected teacher is not assigned to this subject"
      );
    }
  }

  /*
  =========================================
  CHECK CLASS ASSIGNMENT
  =========================================
  */

  if (
    Array.isArray(subject.classIds) &&
    subject.classIds.length > 0
  ) {
    const assigned =
      subject.classIds.some(
        (id) =>
          id.toString() ===
          payload.classId.toString()
      );

    if (!assigned) {
      throw new ApiError(
        400,
        "Selected subject is not assigned to this class"
      );
    }
  }

  /*
  =========================================
  CHECK TEACHER CLASS ASSIGNMENT
  =========================================
  */

  if (
    Array.isArray(teacher.classIds) &&
    teacher.classIds.length > 0
  ) {
    const assigned =
      teacher.classIds.some(
        (id) =>
          id.toString() ===
          payload.classId.toString()
      );

    if (!assigned) {
      throw new ApiError(
        400,
        "Selected teacher is not assigned to this class"
      );
    }
  }

  /*
  =========================================
  CHECK TEACHER SUBJECT ASSIGNMENT
  =========================================
  */

  if (
    Array.isArray(teacher.subjectIds) &&
    teacher.subjectIds.length > 0
  ) {
    const assigned =
      teacher.subjectIds.some(
        (id) =>
          id.toString() ===
          payload.subjectId.toString()
      );

    if (!assigned) {
      throw new ApiError(
        400,
        "Selected teacher is not assigned to this subject"
      );
    }
  }

  return {
    classItem,
    subject,
    teacher,
  };
}

/*
=========================================
CREATE REQUIREMENT
=========================================
*/

export async function createTimetableRequirement(
  payload,
  schoolId
) {
  await validateRequirementRelations(
    payload,
    schoolId
  );

  const existing =
    await TimetableRequirement.findOne({
      schoolId,
      sessionId: payload.sessionId,
      termId: payload.termId,
      classId: payload.classId,
      subjectId: payload.subjectId,
    });

  if (existing) {
    throw new ApiError(
      409,
      "Timetable requirement already exists for this class and subject"
    );
  }

  const requirement =
    await TimetableRequirement.create({
      schoolId,
      sessionId: payload.sessionId,
      termId: payload.termId,
      classId: payload.classId,
      subjectId: payload.subjectId,
      teacherId: payload.teacherId,
      periodsPerWeek:
        payload.periodsPerWeek,
      allowDoublePeriod:
        payload.allowDoublePeriod ??
        false,
      maxConsecutivePeriods:
        payload.maxConsecutivePeriods ??
        1,
      isActive:
        payload.isActive ?? true,
    });

  return getTimetableRequirementById(
    requirement._id,
    schoolId
  );
}

/*
=========================================
LIST REQUIREMENTS
=========================================
*/

export async function listTimetableRequirements(
  schoolId,
  filters = {}
) {
  const query = {
    schoolId,
  };

  if (filters.sessionId) {
    validateObjectId(
      filters.sessionId,
      "session"
    );

    query.sessionId =
      filters.sessionId;
  }

  if (filters.termId) {
    validateObjectId(
      filters.termId,
      "term"
    );

    query.termId =
      filters.termId;
  }

  if (filters.classId) {
    validateObjectId(
      filters.classId,
      "class"
    );

    query.classId =
      filters.classId;
  }

  if (filters.subjectId) {
    validateObjectId(
      filters.subjectId,
      "subject"
    );

    query.subjectId =
      filters.subjectId;
  }

  if (filters.teacherId) {
    validateObjectId(
      filters.teacherId,
      "teacher"
    );

    query.teacherId =
      filters.teacherId;
  }

  if (
    filters.isActive !== undefined
  ) {
    query.isActive =
      filters.isActive;
  }

  return TimetableRequirement.find(
    query
  )
    .populate(
      "sessionId",
      "name startDate endDate"
    )
    .populate(
      "termId",
      "name startDate endDate"
    )
    .populate(
      "classId",
      "name code level"
    )
    .populate(
      "subjectId",
      "name code category isCore"
    )
    .populate(
      "teacherId",
      "firstName middleName lastName email"
    )
    .sort({
      classId: 1,
      subjectId: 1,
    });
}

/*
=========================================
GET ONE REQUIREMENT
=========================================
*/

export async function getTimetableRequirementById(
  id,
  schoolId
) {
  validateObjectId(
    id,
    "timetable requirement"
  );

  const requirement =
    await TimetableRequirement.findOne({
      _id: id,
      schoolId,
    })
      .populate(
        "sessionId",
        "name startDate endDate"
      )
      .populate(
        "termId",
        "name startDate endDate"
      )
      .populate(
        "classId",
        "name code level"
      )
      .populate(
        "subjectId",
        "name code category isCore"
      )
      .populate(
        "teacherId",
        "firstName middleName lastName email"
      );

  if (!requirement) {
    throw new ApiError(
      404,
      "Timetable requirement not found"
    );
  }

  return requirement;
}

/*
=========================================
UPDATE REQUIREMENT
=========================================
*/

export async function updateTimetableRequirement(
  id,
  payload,
  schoolId
) {
  validateObjectId(
    id,
    "timetable requirement"
  );

  const requirement =
    await TimetableRequirement.findOne({
      _id: id,
      schoolId,
    });

  if (!requirement) {
    throw new ApiError(
      404,
      "Timetable requirement not found"
    );
  }

  const updatedPayload = {
    sessionId:
      payload.sessionId ||
      requirement.sessionId.toString(),

    termId:
      payload.termId ||
      requirement.termId.toString(),

    classId:
      payload.classId ||
      requirement.classId.toString(),

    subjectId:
      payload.subjectId ||
      requirement.subjectId.toString(),

    teacherId:
      payload.teacherId ||
      requirement.teacherId.toString(),
  };

  await validateRequirementRelations(
    updatedPayload,
    schoolId
  );

  /*
  =========================================
  CHECK DUPLICATE
  =========================================
  */

  const duplicate =
    await TimetableRequirement.findOne({
      schoolId,
      sessionId:
        updatedPayload.sessionId,
      termId:
        updatedPayload.termId,
      classId:
        updatedPayload.classId,
      subjectId:
        updatedPayload.subjectId,
      _id: {
        $ne: id,
      },
    });

  if (duplicate) {
    throw new ApiError(
      409,
      "Another timetable requirement already exists for this class and subject"
    );
  }

  /*
  =========================================
  APPLY UPDATES
  =========================================
  */

  requirement.sessionId =
    updatedPayload.sessionId;

  requirement.termId =
    updatedPayload.termId;

  requirement.classId =
    updatedPayload.classId;

  requirement.subjectId =
    updatedPayload.subjectId;

  requirement.teacherId =
    updatedPayload.teacherId;

  if (
    payload.periodsPerWeek !==
    undefined
  ) {
    requirement.periodsPerWeek =
      payload.periodsPerWeek;
  }

  if (
    payload.allowDoublePeriod !==
    undefined
  ) {
    requirement.allowDoublePeriod =
      payload.allowDoublePeriod;
  }

  if (
    payload.maxConsecutivePeriods !==
    undefined
  ) {
    requirement.maxConsecutivePeriods =
      payload.maxConsecutivePeriods;
  }

  if (
    payload.isActive !== undefined
  ) {
    requirement.isActive =
      payload.isActive;
  }

  await requirement.save();

  return getTimetableRequirementById(
    id,
    schoolId
  );
}

/*
=========================================
DELETE REQUIREMENT
=========================================
*/

export async function deleteTimetableRequirement(
  id,
  schoolId
) {
  validateObjectId(
    id,
    "timetable requirement"
  );

  const requirement =
    await TimetableRequirement.findOneAndDelete({
      _id: id,
      schoolId,
    });

  if (!requirement) {
    throw new ApiError(
      404,
      "Timetable requirement not found"
    );
  }

  return requirement;
}

/*
=========================================
BULK CREATE REQUIREMENTS
=========================================
*/

export async function bulkCreateTimetableRequirements(
  requirements,
  schoolId
) {
  const results = {
    total: requirements.length,
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    createdRequirements: [],
  };

  for (
    let index = 0;
    index < requirements.length;
    index++
  ) {
    const payload =
      requirements[index];

    try {
      await validateRequirementRelations(
        payload,
        schoolId
      );

      const existing =
        await TimetableRequirement.findOne({
          schoolId,
          sessionId:
            payload.sessionId,
          termId: payload.termId,
          classId: payload.classId,
          subjectId:
            payload.subjectId,
        });

      if (existing) {
        results.skipped++;

        continue;
      }

      const requirement =
        await TimetableRequirement.create({
          schoolId,
          sessionId:
            payload.sessionId,
          termId:
            payload.termId,
          classId:
            payload.classId,
          subjectId:
            payload.subjectId,
          teacherId:
            payload.teacherId,
          periodsPerWeek:
            payload.periodsPerWeek,
          allowDoublePeriod:
            payload.allowDoublePeriod ??
            false,
          maxConsecutivePeriods:
            payload.maxConsecutivePeriods ??
            1,
          isActive:
            payload.isActive ??
            true,
        });

      results.created++;

      results.createdRequirements.push(
        requirement
      );
    } catch (error) {
      results.failed++;

      results.errors.push({
        index,
        message:
          error?.message ||
          "Failed to create timetable requirement",
      });
    }
  }

  return results;
}
