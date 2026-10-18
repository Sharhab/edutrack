
import mongoose from "mongoose";

import { LessonNote } from "./lesson-note.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ClassModel } from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { ApiError } from "../../utils/apiError.js";
import { generateLessonNoteWithAI } from "./lesson-note.ai.service.js";

/**
 * Find the active teacher associated with the signed-in user.
 */
async function getActiveTeacher(userId) {
  const teacher = await Teacher.findOne({
    userId,
    status: "active",
    isActive: true,
  }).lean();

  if (!teacher) {
    throw new ApiError(
      404,
      "Active teacher profile not found"
    );
  }

  return teacher;
}

/**
 * Check whether a teacher is assigned to a class
 * and subject combination.
 */
function hasTeachingAssignment(
  teacher,
  classId,
  subjectId
) {
  const assignments = teacher.assignments || [];

  return assignments.some(
    (assignment) =>
      String(assignment.classId) === String(classId) &&
      String(assignment.subjectId) === String(subjectId)
  );
}

/**
 * Validate the requested academic records and
 * confirm that the teacher is authorized to use them.
 */
async function validateLessonNoteContext(
  teacher,
  payload
) {
  const {
    sessionId,
    termId,
    classId,
    subjectId,
  } = payload;

  const isValidId = (id) =>
    mongoose.isValidObjectId(id);

  if (
    !isValidId(sessionId) ||
    !isValidId(termId) ||
    !isValidId(classId) ||
    !isValidId(subjectId)
  ) {
    throw new ApiError(
      400,
      "Invalid session, term, class, or subject ID"
    );
  }

  const schoolId = teacher.schoolId;

  const [session, term, schoolClass, subject] =
    await Promise.all([
      Session.findOne({
        _id: sessionId,
        schoolId,
      }).lean(),

      Term.findOne({
        _id: termId,
        sessionId,
        schoolId,
      }).lean(),

      ClassModel.findOne({
        _id: classId,
        schoolId,
      }).lean(),

      SubjectModel.findOne({
        _id: subjectId,
        schoolId,
      }).lean(),
    ]);

  if (!session) {
    throw new ApiError(
      400,
      "The selected academic session is invalid"
    );
  }

  if (!term) {
    throw new ApiError(
      400,
      "The selected term does not belong to this session"
    );
  }

  if (!schoolClass) {
    throw new ApiError(
      400,
      "The selected class was not found in your school"
    );
  }

  if (!subject) {
    throw new ApiError(
      400,
      "The selected subject was not found in your school"
    );
  }

  if (
    !hasTeachingAssignment(
      teacher,
      classId,
      subjectId
    )
  ) {
    throw new ApiError(
      403,
      "You are not assigned to teach this subject in this class"
    );
  }

  return {
    session,
    term,
    schoolClass,
    subject,
  };
}

/**
 * Generate an AI lesson note.
 * Generation does not save the note automatically.
 * The teacher must review it and save it separately.
 */
export async function generateTeacherLessonNote(
  userId,
  payload
) {
  const teacher = await getActiveTeacher(userId);

  const {
    session,
    term,
    schoolClass,
    subject,
  } = await validateLessonNoteContext(
    teacher,
    payload
  );

  const generatedContent =
    await generateLessonNoteWithAI({
      subject: subject.name,
      className: schoolClass.name,
      session: session.name,
      term: term.name,
      topic: payload.topic,
      week: payload.week || "",
      durationMinutes: payload.durationMinutes || 40,
      learningObjectives:
        payload.learningObjectives || [],
      curriculumRequirements:
        payload.curriculumRequirements || "",
    });

  return {
    success: true,
    message:
      "Lesson note generated. Review it before saving.",
    lessonNote: {
      sessionId: session._id,
      termId: term._id,
      classId: schoolClass._id,
      subjectId: subject._id,
      topic: payload.topic,
      week: payload.week || "",
      durationMinutes:
        payload.durationMinutes || 40,
      curriculumRequirements:
        payload.curriculumRequirements || "",
      content: generatedContent,
      status: "draft",
    },
  };
}

/**
 * Save a reviewed lesson note.
 */
export async function saveTeacherLessonNote(
  userId,
  payload
) {
  const teacher = await getActiveTeacher(userId);

  await validateLessonNoteContext(
    teacher,
    payload
  );

  if (!payload.content) {
    throw new ApiError(
      400,
      "Lesson note content is required"
    );
  }

  const lessonNote = await LessonNote.create({
    schoolId: teacher.schoolId,
    teacherId: teacher._id,
    userId: teacher.userId,
    sessionId: payload.sessionId,
    termId: payload.termId,
    classId: payload.classId,
    subjectId: payload.subjectId,
    topic: payload.topic,
    week: payload.week || "",
    durationMinutes:
      payload.durationMinutes || 40,
    curriculumRequirements:
      payload.curriculumRequirements || "",
    content: payload.content,
    status: "saved",
  });

  return {
    success: true,
    message: "Lesson note saved successfully",
    lessonNote,
  };
}

/**
 * List only the signed-in teacher's saved notes
 * belonging to the teacher's school.
 */
export async function getTeacherLessonNotes(
  userId,
  filters = {}
) {
  const teacher = await getActiveTeacher(userId);

  const query = {
    schoolId: teacher.schoolId,
    userId: teacher.userId,
    status: "saved",
  };

  for (const field of [
    "sessionId",
    "termId",
    "classId",
    "subjectId",
  ]) {
    if (filters[field]) {
      if (!mongoose.isValidObjectId(filters[field])) {
        throw new ApiError(
          400,
          `Invalid ${field}`
        );
      }

      query[field] = filters[field];
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

/**
 * Retrieve one saved lesson note.
 */
export async function getTeacherLessonNoteById(
  userId,
  lessonNoteId
) {
  const teacher = await getActiveTeacher(userId);

  if (!mongoose.isValidObjectId(lessonNoteId)) {
    throw new ApiError(
      400,
      "Invalid lesson note ID"
    );
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
    throw new ApiError(
      404,
      "Lesson note not found"
    );
  }

  return {
    success: true,
    lessonNote,
  };
}
