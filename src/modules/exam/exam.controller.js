


import mongoose from "mongoose";
import { Exam } from "./exam.model.js";
import { ClassModel } from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { Teacher } from "../teachers/teacher.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function createExamHandler(req, res, next) {
  try {
    const schoolId = req.user?.schoolId;

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
    } = req.body;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School context is missing.",
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      ![classId, subjectId, sessionId, termId].every(isValidId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, class, subject, session, and term are required.",
      });
    }

    if (
      !Array.isArray(questions) ||
      questions.length === 0 ||
      questions.length > 200
    ) {
      return res.status(400).json({
        success: false,
        message: "An exam must contain between 1 and 200 questions.",
      });
    }

    const duration = Number(durationMinutes);
    const start = new Date(startsAt);
    const end = new Date(endsAt);

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 300 ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return res.status(400).json({
        success: false,
        message: "Check the exam duration and schedule.",
      });
    }

    // Validate every question before saving.
    for (const question of questions) {
      if (
        !question ||
        typeof question.text !== "string" ||
        !question.text.trim() ||
        !Array.isArray(question.options) ||
        question.options.length < 2 ||
        question.options.length > 6 ||
        question.options.some(
          (option) =>
            typeof option !== "string" || !option.trim()
        ) ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= question.options.length ||
        !Number.isFinite(Number(question.marks)) ||
        Number(question.marks) < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more questions have invalid options, answer, or marks.",
        });
      }
    }

    // Verify that all academic records belong to this school.
    const [classDoc, subjectDoc, sessionDoc, termDoc] =
      await Promise.all([
        ClassModel.findOne({
          _id: classId,
          schoolId,
        }).select("_id"),

        SubjectModel.findOne({
          _id: subjectId,
          schoolId,
          isActive: true,
        }).select("_id"),

        Session.findOne({
          _id: sessionId,
          schoolId,
        }).select("_id"),

        Term.findOne({
          _id: termId,
          schoolId,
        }).select("_id"),
      ]);

    if (!classDoc || !subjectDoc || !sessionDoc || !termDoc) {
      return res.status(400).json({
        success: false,
        message:
          "Class, subject, session, or term is invalid for this school.",
      });
    }

    // Confirm that a teacher is assigned to this class and subject.
    // Prefer explicit class-subject assignment pairs.
    const explicitAssignment = await Teacher.findOne({
      schoolId,
      assignments: {
        $elemMatch: {
          classId: new mongoose.Types.ObjectId(classId),
          subjectId: new mongoose.Types.ObjectId(subjectId),
        },
      },
    })
      .select("_id")
      .lean();

    // Backward compatibility for teachers using separate arrays.
    // This fallback assumes each listed subject applies to each
    // listed class for that teacher.
    let legacyAssignment = null;

    if (!explicitAssignment) {
      legacyAssignment = await Teacher.findOne({
        schoolId,
        subjectIds: new mongoose.Types.ObjectId(subjectId),
        classIds: new mongoose.Types.ObjectId(classId),
      })
        .select("_id")
        .lean();
    }

    if (!explicitAssignment && !legacyAssignment) {
      return res.status(400).json({
        success: false,
        message:
          "No teacher is assigned to teach this subject in the selected class. Check teacher assignments.",
      });
    }

    const exam = await Exam.create({
      schoolId,
      title: title.trim(),
      instructions,
      classId,
      subjectId,
      sessionId,
      termId,
      questions,
      durationMinutes: duration,
      startsAt: start,
      endsAt: end,
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

export async function listExamsHandler(req, res, next) {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School context is missing.",
      });
    }

    const filter = { schoolId };

    for (const field of [
      "classId",
      "subjectId",
      "sessionId",
      "termId",
      "status",
    ]) {
      const value = req.query[field];

      if (!value) continue;

      if (
        ["classId", "subjectId", "sessionId", "termId"].includes(field) &&
        !isValidId(value)
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}.`,
        });
      }

      if (
        field === "status" &&
        !["draft", "published", "closed"].includes(value)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid exam status.",
        });
      }

      filter[field] = value;
    }

    const exams = await Exam.find(filter)
      .select("-questions.correctOptionIndex")
      .populate("classId", "name level")
      .populate("subjectId", "name code")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    next(error);
  }
}

export async function publishExamHandler(req, res, next) {
  try {
    const { examId } = req.params;
    const schoolId = req.user?.schoolId;

    if (!isValidId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School context is missing.",
      });
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

    if (!exam.questions.length) {
      return res.status(400).json({
        success: false,
        message: "Add questions before publishing.",
      });
    }

    if (
      new Date(exam.endsAt) <= new Date(exam.startsAt) ||
      new Date(exam.endsAt) <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The exam schedule is invalid or the end time has already passed.",
      });
    }

    exam.status = "published";
    await exam.save();

    return res.json({
      success: true,
      message: "Exam published successfully.",
      data: {
        _id: exam._id,
        title: exam.title,
        status: exam.status,
        startsAt: exam.startsAt,
        endsAt: exam.endsAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function closeExamHandler(req, res, next) {
  try {
    const { examId } = req.params;
    const schoolId = req.user?.schoolId;

    if (!isValidId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School context is missing.",
      });
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

    if (exam.status !== "published") {
      return res.status(409).json({
        success: false,
        message: "Only published exams can be closed.",
      });
    }

    exam.status = "closed";
    await exam.save();

    return res.json({
      success: true,
      message: "Exam closed successfully.",
      data: {
        _id: exam._id,
        title: exam.title,
        status: exam.status,
      },
    });
  } catch (error) {
    next(error);
  }
}
