

import mongoose from "mongoose";

import { LessonNote } from "./lesson-note.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ClassModel } from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { ApiError } from "../../utils/apiError.js";
import { generateLessonNoteWithAI } from "./lesson-note.ai.service.js";

async function getActiveTeacher(userId) {
  const teacher = await Teacher.findOne({
    userId,
    status: "active",
    isActive: true,
  }).lean();

  if (!teacher) {
    throw new ApiError(404, "Active teacher profile not found");
  }

  return teacher;
}

function includesId(ids = [], id) {
  return ids.some((item) => String(item?._id || item) === String(id));
}

/**
 * Check both the teacher's assignment records and
 * the subject's class/teacher restrictions.
 */
function hasTeachingAssignment(teacher, subject, classId, subjectId) {
  const explicitAssignment = (teacher.assignments || []).some(
    (assignment) =>
      String(assignment.classId) === String(classId) &&
      String(assignment.subjectId) === String(subjectId)
  );

  const legacyAssignment =
    includesId(teacher.classIds, classId) &&
    includesId(teacher.subjectIds, subjectId);

  const subjectAllowsClass =
    !subject.classIds?.length ||
    includesId(subject.classIds, classId);

  const subjectAllowsTeacher =
    !subject.teacherIds?.length ||
    includesId(subject.teacherIds, teacher.userId);

  return (
    (explicitAssignment || legacyAssignment) &&
    subjectAllowsClass &&
    subjectAllowsTeacher
  );
}

async function validateLessonNoteContext(teacher, payload) {
  const { sessionId, termId, classId, subjectId } = payload;

  for (const [field, value] of Object.entries({
    sessionId,
    termId,
    classId,
    subjectId,
  })) {
    if (!mongoose.isValidObjectId(value)) {
      throw new ApiError(400, `Invalid ${field}`);
    }
  }

  const schoolId = teacher.schoolId;

  const [session, term, schoolClass, subject] = await Promise.all([
    Session.findOne({ _id: sessionId, schoolId }).lean(),
    Term.findOne({ _id: termId, sessionId, schoolId }).lean(),
    ClassModel.findOne({ _id: classId, schoolId }).lean(),
    SubjectModel.findOne({ _id: subjectId, schoolId }).lean(),
  ]);

  if (!session) {
    throw new ApiError(400, "Invalid academic session");
  }

  if (!term) {
    throw new ApiError(
      400,
      "The selected term does not belong to this academic session"
    );
  }

  if (!schoolClass) {
    throw new ApiError(400, "Class not found in your school");
  }

  if (!subject) {
    throw new ApiError(400, "Subject not found in your school");
  }

  if (
    schoolClass.isActive === false ||
    subject.isActive === false
  ) {
    throw new ApiError(400, "The selected class or subject is inactive");
  }

  if (
    !hasTeachingAssignment(
      teacher,
      subject,
      classId,
      subjectId
    )
  ) {
    throw new ApiError(
      403,
      "You are not assigned to teach this subject in this class"
    );
  }

  return { session, term, schoolClass, subject };
}

function normalizeWeek(week) {
  return week == null || week === "" ? null : week;
}

function normalizeDuration(durationMinutes) {
  return durationMinutes ?? 40;
}

export async function generateTeacherLessonNote(userId, payload) {
  const teacher = await getActiveTeacher(userId);

  const { session, term, schoolClass, subject } =
    await validateLessonNoteContext(teacher, payload);

  const durationMinutes = normalizeDuration(payload.durationMinutes);
  const week = normalizeWeek(payload.week);

  const content = await generateLessonNoteWithAI({
    subject: subject.name,
    className: schoolClass.name,
    classLevel: schoolClass.level || "",
    session: session.name,
    term: term.name,
    topic: payload.topic,
    week: week ?? "",
    durationMinutes,
    learningObjectives: payload.learningObjectives || [],
    curriculumRequirements: payload.curriculumRequirements || "",
  });

  return {
    success: true,
    message: "Lesson note generated. Review it before saving.",
    lessonNote: {
      sessionId: session._id,
      termId: term._id,
      classId: schoolClass._id,
      subjectId: subject._id,
      topic: payload.topic,
      week,
      durationMinutes,
      curriculumRequirements: payload.curriculumRequirements || "",
      content,
      status: "draft",
    },
  };
}

export async function saveTeacherLessonNote(userId, payload) {
  const teacher = await getActiveTeacher(userId);

  await validateLessonNoteContext(teacher, payload);

  const lessonNote = await LessonNote.create({
    schoolId: teacher.schoolId,
    teacherId: teacher._id,
    userId: teacher.userId,
    sessionId: payload.sessionId,
    termId: payload.termId,
    classId: payload.classId,
    subjectId: payload.subjectId,
    topic: payload.topic,
    week: normalizeWeek(payload.week),
    durationMinutes: normalizeDuration(payload.durationMinutes),
    curriculumRequirements: payload.curriculumRequirements || "",
    content: payload.content,
    status: "saved",
  });

  return {
    success: true,
    message: "Lesson note saved successfully",
    lessonNote,
  };
}

export async function getTeacherLessonNotes(userId, filters = {}) {
  const teacher = await getActiveTeacher(userId);

  const query = {
    schoolId: teacher.schoolId,
    userId: teacher.userId,
    status: "saved",
  };

  for (const field of ["sessionId", "termId", "classId", "subjectId"]) {
    const value = filters[field];

    if (value) {
      if (!mongoose.isValidObjectId(value)) {
        throw new ApiError(400, `Invalid ${field}`);
      }

      query[field] = value;
    }
  }

  const lessonNotes = await LessonNote.find(query)
    .sort({ updatedAt: -1 })
    .limit(100)
    .populate("sessionId", "name")
    .populate("termId", "name")
    .populate("classId", "name")
    .populate("subjectId", "name code")
    .lean();

  return {
    success: true,
    count: lessonNotes.length,
    lessonNotes,
  };
}

export async function getTeacherLessonNoteById(userId, lessonNoteId) {
  const teacher = await getActiveTeacher(userId);

  if (!mongoose.isValidObjectId(lessonNoteId)) {
    throw new ApiError(400, "Invalid lesson note ID");
  }

  const lessonNote = await LessonNote.findOne({
    _id: lessonNoteId,
    schoolId: teacher.schoolId,
    userId: teacher.userId,
  })
    .populate("sessionId", "name")
    .populate("termId", "name")
    .populate("classId", "name")
    .populate("subjectId", "name code")
    .lean();

  if (!lessonNote) {
    throw new ApiError(404, "Lesson note not found");
  }

  return { success: true, lessonNote };
}
