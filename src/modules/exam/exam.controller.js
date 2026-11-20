
import mongoose from "mongoose";

import { Exam } from "./exam.model.js";
import { ClassModel } from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { Teacher } from "../teachers/teacher.model.js";

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const OBJECT_ID_FIELDS = [
  "classId",
  "subjectId",
  "sessionId",
  "termId",
];

const EXAM_STATUSES = [
  "draft",
  "published",
  "closed",
];

function badRequest(res, message) {
  return res.status(400).json({
    success: false,
    message,
  });
}

function normalizeQuestions(questions) {
  if (
    !Array.isArray(questions) ||
    questions.length < 1 ||
    questions.length > 200
  ) {
    return {
      error:
        "An exam must contain between 1 and 200 questions.",
    };
  }

  const normalized = [];

  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];

    if (
      !question ||
      typeof question.text !== "string" ||
      !question.text.trim()
    ) {
      return {
        error: `Question ${index + 1} has invalid text.`,
      };
    }

    if (
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      question.options.length > 6
    ) {
      return {
        error: `Question ${index + 1} must have 2 to 6 options.`,
      };
    }

    const options = question.options.map((option) =>
      typeof option === "string" ? option.trim() : ""
    );

    if (options.some((option) => !option)) {
      return {
        error: `Question ${index + 1} contains an empty option.`,
      };
    }

    const uniqueOptions = new Set(
      options.map((option) => option.toLowerCase())
    );

    if (uniqueOptions.size !== options.length) {
      return {
        error: `Question ${index + 1} contains duplicate options.`,
      };
    }

    const correctOptionIndex =
      Number(question.correctOptionIndex);

    if (
      !Number.isInteger(correctOptionIndex) ||
      correctOptionIndex < 0 ||
      correctOptionIndex >= options.length
    ) {
      return {
        error: `Question ${index + 1} has an invalid correct answer.`,
      };
    }

    const marks = Number(question.marks);

    if (
      !Number.isInteger(marks) ||
      marks < 1 ||
      marks > 100
    ) {
      return {
        error: `Question ${index + 1} must have valid whole-number marks.`,
      };
    }

    normalized.push({
      text: question.text.trim(),
      options,
      correctOptionIndex,
      marks,
    });
  }

  return { questions: normalized };
}

function validateSchedule({
  durationMinutes,
  startsAt,
  endsAt,
}) {
  const duration = Number(durationMinutes);
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 300
  ) {
    return {
      error: "Exam duration must be between 1 and 300 minutes.",
    };
  }

  if (
    !startsAt ||
    !endsAt ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return {
      error: "Valid exam start and end dates are required.",
    };
  }

  if (end <= start) {
    return {
      error: "Exam end time must be after the start time.",
    };
  }

  return {
    duration,
    start,
    end,
  };
}

/**
 * Validate academic context.
 * All records must belong to the authenticated school.
 */
async function validateExamContext({
  schoolId,
  classId,
  subjectId,
  sessionId,
  termId,
}) {
  const [
    classDoc,
    subjectDoc,
    sessionDoc,
    termDoc,
  ] = await Promise.all([
    ClassModel.findOne({
      _id: classId,
      schoolId,
    }).select("_id isActive"),

    SubjectModel.findOne({
      _id: subjectId,
      schoolId,
      isActive: true,
      classIds: classId,
    }).select("_id classIds teacherIds"),

    Session.findOne({
      _id: sessionId,
      schoolId,
    }).select("_id"),

    Term.findOne({
      _id: termId,
      schoolId,
      sessionId,
    }).select("_id sessionId"),
  ]);

  if (!classDoc) {
    return {
      error: "Selected class does not belong to this school.",
    };
  }

  if (classDoc.isActive === false) {
    return {
      error: "Selected class is inactive.",
    };
  }

  if (!subjectDoc) {
    return {
      error:
        "Selected subject is inactive or is not assigned to this class.",
    };
  }

  if (!sessionDoc) {
    return {
      error: "Selected academic session is invalid.",
    };
  }

  if (!termDoc) {
    return {
      error:
        "Selected term does not belong to the selected academic session.",
    };
  }

  return {
    classDoc,
    subjectDoc,
    sessionDoc,
    termDoc,
  };
}

/**
 * Confirm that the school has a teacher assigned
 * to the selected class and subject.
 *
 * Supports:
 * 1. Explicit assignment pairs.
 * 2. Legacy classIds + subjectIds assignments.
 *
 * This does not require the teacher to be the
 * authenticated user because exam creation is
 * handled by the school administrator.
 */
async function validateTeacherAssignment({
  schoolId,
  classId,
  subjectId,
  subjectDoc,
}) {
  const explicitAssignment = await Teacher.findOne({
    schoolId,
    isActive: true,
    status: "active",
    assignments: {
      $elemMatch: {
        classId: new mongoose.Types.ObjectId(classId),
        subjectId: new mongoose.Types.ObjectId(subjectId),
      },
    },
  })
    .select("_id")
    .lean();

  let legacyAssignment = null;

  if (!explicitAssignment) {
    legacyAssignment = await Teacher.findOne({
      schoolId,
      isActive: true,
      status: "active",
      classIds: classId,
      subjectIds: subjectId,
    })
      .select("_id userId")
      .lean();
  }

  const assignedTeacher =
    explicitAssignment || legacyAssignment;

  if (!assignedTeacher) {
    return {
      error:
        "No active teacher is assigned to this subject in the selected class.",
    };
  }

  // If the subject has explicit teacher restrictions,
  // ensure the selected teacher is included.
  if (
    Array.isArray(subjectDoc.teacherIds) &&
    subjectDoc.teacherIds.length > 0
  ) {
    const teacherUserId = legacyAssignment?.userId;

    // Explicit assignment records do not necessarily
    // expose userId in the query above, so verify using
    // the teacher record when restrictions are configured.
    const teacher = await Teacher.findById(
      assignedTeacher._id
    )
      .select("userId")
      .lean();

    const allowed = subjectDoc.teacherIds.some(
      (id) => String(id) === String(teacher?.userId)
    );

    if (!allowed) {
      return {
        error:
          "The assigned teacher is not allowed to teach this subject.",
      };
    }
  }

  return { success: true };
}

/**
 * CREATE EXAM
 * POST /
 */
export async function createExamHandler(req, res, next) {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return badRequest(
        res,
        "School context is missing."
      );
    }

    const {
      title,
      instructions = "",
      classId,
      subjectId,
      sessionId,
      termId,
      questions,
      durationMinutes,
      startsAt,
      endsAt,
      shuffleQuestions = false,
      shuffleOptions = false,
    } = req.body || {};

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 160
    ) {
      return badRequest(
        res,
        "Exam title is required and must not exceed 160 characters."
      );
    }

    for (const field of OBJECT_ID_FIELDS) {
      if (!isValidId(req.body?.[field])) {
        return badRequest(
          res,
          `A valid ${field} is required.`
        );
      }
    }

    if (
      typeof instructions !== "string" ||
      instructions.length > 5000
    ) {
      return badRequest(
        res,
        "Instructions must not exceed 5000 characters."
      );
    }

    if (
      typeof shuffleQuestions !== "boolean" ||
      typeof shuffleOptions !== "boolean"
    ) {
      return badRequest(
        res,
        "Shuffle settings must be true or false."
      );
    }

    const questionResult =
      normalizeQuestions(questions);

    if (questionResult.error) {
      return badRequest(
        res,
        questionResult.error
      );
    }

    const scheduleResult = validateSchedule({
      durationMinutes,
      startsAt,
      endsAt,
    });

    if (scheduleResult.error) {
      return badRequest(
        res,
        scheduleResult.error
      );
    }

    const context = await validateExamContext({
      schoolId,
      classId,
      subjectId,
      sessionId,
      termId,
    });

    if (context.error) {
      return badRequest(
        res,
        context.error
      );
    }

    const assignment =
      await validateTeacherAssignment({
        schoolId,
        classId,
        subjectId,
        subjectDoc: context.subjectDoc,
      });

    if (assignment.error) {
      return badRequest(
        res,
        assignment.error
      );
    }

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user is required.",
      });
    }

    const exam = await Exam.create({
      schoolId,
      title: title.trim(),
      instructions: instructions.trim(),
      classId,
      subjectId,
      sessionId,
      termId,
      questions: questionResult.questions,
      durationMinutes: scheduleResult.duration,
      startsAt: scheduleResult.start,
      endsAt: scheduleResult.end,
      shuffleQuestions,
      shuffleOptions,
      createdBy: req.user._id,
      status: "draft",
    });

    return res.status(201).json({
      success: true,
      message: "CBT exam created successfully.",
      data: exam,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * LIST SCHOOL EXAMS
 * GET /
 */
export async function listExamsHandler(req, res, next) {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return badRequest(
        res,
        "School context is missing."
      );
    }

    const filter = { schoolId };

    for (const field of [
      ...OBJECT_ID_FIELDS,
      "status",
    ]) {
      const value = req.query[field];

      if (!value) continue;

      if (
        OBJECT_ID_FIELDS.includes(field) &&
        !isValidId(value)
      ) {
        return badRequest(
          res,
          `Invalid ${field}.`
        );
      }

      if (
        field === "status" &&
        !EXAM_STATUSES.includes(value)
      ) {
        return badRequest(
          res,
          "Invalid exam status."
        );
      }

      filter[field] = value;
    }

    const exams = await Exam.find(filter)
      .select("-questions.correctOptionIndex")
      .populate("classId", "name level")
      .populate("subjectId", "name code")
      .populate("sessionId", "name")
      .populate("termId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUBLISH EXAM
 * PATCH /:examId/publish
 */
export async function publishExamHandler(req, res, next) {
  try {
    const { examId } = req.params;
    const schoolId = req.user?.schoolId;

    if (!isValidId(examId)) {
      return badRequest(
        res,
        "Invalid exam ID."
      );
    }

    if (!schoolId) {
      return badRequest(
        res,
        "School context is missing."
      );
    }

    const exam = await Exam.findOne({
      _id: examId,
      schoolId,
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    if (exam.status !== "draft") {
      return res.status(409).json({
        success: false,
        message: "Only draft exams can be published.",
      });
    }

    const questionResult =
      normalizeQuestions(exam.questions);

    if (questionResult.error) {
      return badRequest(
        res,
        `Cannot publish exam: ${questionResult.error}`
      );
    }

    const scheduleResult = validateSchedule({
      durationMinutes: exam.durationMinutes,
      startsAt: exam.startsAt,
      endsAt: exam.endsAt,
    });

    if (scheduleResult.error) {
      return badRequest(
        res,
        `Cannot publish exam: ${scheduleResult.error}`
      );
    }

    if (scheduleResult.end <= new Date()) {
      return badRequest(
        res,
        "The exam end time has already passed."
      );
    }

    // Revalidate academic records before publishing.
    const context = await validateExamContext({
      schoolId,
      classId: exam.classId,
      subjectId: exam.subjectId,
      sessionId: exam.sessionId,
      termId: exam.termId,
    });

    if (context.error) {
      return badRequest(
        res,
        `Cannot publish exam: ${context.error}`
      );
    }

    const assignment =
      await validateTeacherAssignment({
        schoolId,
        classId: exam.classId,
        subjectId: exam.subjectId,
        subjectDoc: context.subjectDoc,
      });

    if (assignment.error) {
      return badRequest(
        res,
        `Cannot publish exam: ${assignment.error}`
      );
    }

    // Conditional update prevents two concurrent
    // publish requests from changing the same draft.
    const updatedExam = await Exam.findOneAndUpdate(
      {
        _id: examId,
        schoolId,
        status: "draft",
      },
      {
        $set: {
          status: "published",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedExam) {
      return res.status(409).json({
        success: false,
        message:
          "Exam status changed. Refresh and try again.",
      });
    }

    return res.json({
      success: true,
      message: "Exam published successfully.",
      data: {
        _id: updatedExam._id,
        title: updatedExam.title,
        status: updatedExam.status,
        startsAt: updatedExam.startsAt,
        endsAt: updatedExam.endsAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * CLOSE EXAM
 * PATCH /:examId/close
 */
export async function closeExamHandler(req, res, next) {
  try {
    const { examId } = req.params;
    const schoolId = req.user?.schoolId;

    if (!isValidId(examId)) {
      return badRequest(
        res,
        "Invalid exam ID."
      );
    }

    if (!schoolId) {
      return badRequest(
        res,
        "School context is missing."
      );
    }

    const updatedExam = await Exam.findOneAndUpdate(
      {
        _id: examId,
        schoolId,
        status: "published",
      },
      {
        $set: {
          status: "closed",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedExam) {
      const existing = await Exam.findOne({
        _id: examId,
        schoolId,
      }).select("_id status");

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Exam not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Only published exams can be closed.",
      });
    }

    return res.json({
      success: true,
      message: "Exam closed successfully.",
      data: {
        _id: updatedExam._id,
        title: updatedExam.title,
        status: updatedExam.status,
      },
    });
  } catch (error) {
    next(error);
  }
}



