

import mongoose from "mongoose";
import { Exam } from "./exam.model.js";
import { ClassModel } from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export async function createExamHandler(req, res, next) {
  try {
    const schoolId = req.user.schoolId;
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
      !title?.trim() ||
      ![classId, subjectId, sessionId, termId].every(isValidId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, class, subject, session, and term are required.",
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
        typeof question.text !== "string" ||
        !question.text.trim() ||
        !Array.isArray(question.options) ||
        question.options.length < 2 ||
        question.options.length > 6 ||
        question.options.some(
          (option) => typeof option !== "string" || !option.trim()
        ) ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= question.options.length ||
        !Number.isFinite(Number(question.marks)) ||
        Number(question.marks) < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more questions have invalid options, answer, or marks.",
        });
      }
    }

    // Verify all academic records belong to this tenant.
    const [classDoc, subjectDoc, sessionDoc, termDoc] =
      await Promise.all([
        ClassModel.findOne({ _id: classId, schoolId }).select("_id"),
        SubjectModel.findOne({
          _id: subjectId,
          schoolId,
          isActive: true,
        }).select("_id classIds"),
        Session.findOne({ _id: sessionId, schoolId }).select("_id"),
        Term.findOne({ _id: termId, schoolId }).select("_id"),
      ]);

    if (!classDoc || !subjectDoc || !sessionDoc || !termDoc) {
      return res.status(400).json({
        success: false,
        message: "Class, subject, session, or term is invalid for this school.",
      });
    }

    const subjectHasClass = (subjectDoc.classIds || []).some(
      (id) => String(id) === String(classId)
    );

    if (!subjectHasClass) {
      return res.status(400).json({
        success: false,
        message: "This subject is not assigned to the selected class.",
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
    const schoolId = req.user.schoolId;
    const filter = { schoolId };

    for (const field of ["classId", "subjectId", "sessionId", "termId", "status"]) {
      if (req.query[field]) {
        if (
          ["classId", "subjectId", "sessionId", "termId"].includes(field) &&
          !isValidId(req.query[field])
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field}.`,
          });
        }

        if (field === "status" &&
          !["draft", "published", "closed"].includes(req.query.status)) {
          return res.status(400).json({
            success: false,
            message: "Invalid exam status.",
          });
        }

        filter[field] = req.query[field];
      }
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
    const schoolId = req.user.schoolId;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
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

    if (new Date(exam.endsAt) <= new Date(exam.startsAt)) {
      return res.status(400).json({
        success: false,
        message: "The exam schedule is invalid.",
      });
    }

    if (new Date(exam.endsAt) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "The exam end time has already passed.",
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

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const exam = await Exam.findOne({
      _id: examId,
      schoolId: req.user.schoolId,
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


