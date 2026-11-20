

import mongoose from "mongoose";
import { Exam } from "./exam.model.js";
import { ExamAttempt } from "./attempt.model.js";
import { Student } from "../students/student.model.js";

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

function studentSafeExam(exam) {
  return {
    _id: exam._id,
    title: exam.title,
    instructions: exam.instructions,
    durationMinutes: exam.durationMinutes,
    startsAt: exam.startsAt,
    endsAt: exam.endsAt,
    questions: exam.questions.map((question) => ({
      _id: question._id,
      text: question.text,
      options: question.options,
      marks: question.marks,
    })),
  };
}

async function getStudent(req) {
  if (
    !req.user ||
    req.user.role !== "student" ||
    !req.user.schoolId ||
    !req.user.studentId
  ) {
    return null;
  }

  return Student.findOne({
    _id: req.user.studentId,
    schoolId: req.user.schoolId,
    status: "active",
  }).select("_id classId");
}

function deadlineFor(exam, attempt) {
  return new Date(
    Math.min(
      new Date(exam.endsAt).getTime(),
      new Date(attempt.startedAt).getTime() +
        exam.durationMinutes * 60_000
    )
  );
}

function calculateScore(exam, answers) {
  let score = 0;

  for (const question of exam.questions) {
    const selected = answers?.get
      ? answers.get(String(question._id))
      : answers?.[String(question._id)];

    if (selected === question.correctOptionIndex) {
      score += Number(question.marks || 0);
    }
  }

  const totalMarks = exam.questions.reduce(
    (total, question) => total + Number(question.marks || 0),
    0
  );

  return { score, totalMarks };
}

/**
 * Finalizes an attempt exactly once.
 *
 * This is also used for expired attempts. The score is calculated
 * from answers already persisted in the database.
 */
async function finalizeAttempt(attempt, exam) {
  const { score, totalMarks } = calculateScore(
    exam,
    attempt.answers
  );

  const submitted = await ExamAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      schoolId: attempt.schoolId,
      studentId: attempt.studentId,
      examId: attempt.examId,
      status: "in_progress",
    },
    {
      $set: {
        score,
        totalMarks,
        submittedAt: new Date(),
        status: "submitted",
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("_id score totalMarks submittedAt status");

  if (submitted) return submitted;

  // Another request may have finalized it at the same time.
  return ExamAttempt.findOne({
    _id: attempt._id,
    schoolId: attempt.schoolId,
    studentId: attempt.studentId,
    examId: attempt.examId,
  }).select("_id score totalMarks submittedAt status");
}

async function getAttemptExam(attempt, schoolId) {
  return Exam.findOne({
    _id: attempt.examId,
    schoolId,
  });
}

export async function startExamHandler(req, res, next) {
  try {
    const { examId } = req.params;

    if (!validId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const student = await getStudent(req);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    if (!student.classId) {
      return res.status(400).json({
        success: false,
        message: "No class has been assigned to this student.",
      });
    }

    const exam = await Exam.findOne({
      _id: examId,
      schoolId: req.user.schoolId,
      classId: student.classId,
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found for your class.",
      });
    }

    // Check for an existing attempt first. This allows a student
    // to resume an attempt that was started before the exam was closed.
    let attempt = await ExamAttempt.findOne({
      schoolId: req.user.schoolId,
      examId: exam._id,
      studentId: student._id,
    });

    const now = new Date();

    if (attempt?.status === "submitted") {
      return res.status(409).json({
        success: false,
        message: "This exam has already been submitted.",
      });
    }

    if (attempt?.status === "in_progress") {
      if (now >= deadlineFor(exam, attempt)) {
        await finalizeAttempt(attempt, exam);

        return res.status(409).json({
          success: false,
          message: "Your exam time has ended and your attempt was submitted.",
        });
      }

      return res.json({
        success: true,
        data: {
          attemptId: attempt._id,
          deadline: deadlineFor(exam, attempt),
          exam: studentSafeExam(exam),
          answers: Object.fromEntries(attempt.answers || []),
        },
      });
    }

    // A new attempt can only be created while the exam is published
    // and inside its scheduled availability window.
    if (
      exam.status !== "published" ||
      now < new Date(exam.startsAt) ||
      now >= new Date(exam.endsAt)
    ) {
      return res.status(404).json({
        success: false,
        message: "Exam is not currently open for your class.",
      });
    }

    try {
      attempt = await ExamAttempt.findOneAndUpdate(
        {
          schoolId: req.user.schoolId,
          examId: exam._id,
          studentId: student._id,
        },
        {
          $setOnInsert: {
            schoolId: req.user.schoolId,
            examId: exam._id,
            studentId: student._id,
            startedAt: now,
            status: "in_progress",
            totalMarks: exam.questions.reduce(
              (total, question) =>
                total + Number(question.marks || 0),
              0
            ),
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;

      attempt = await ExamAttempt.findOne({
        schoolId: req.user.schoolId,
        examId: exam._id,
        studentId: student._id,
      });
    }

    if (!attempt) {
      return res.status(500).json({
        success: false,
        message: "Could not create your exam attempt.",
      });
    }

    if (attempt.status === "submitted") {
      return res.status(409).json({
        success: false,
        message: "This exam has already been submitted.",
      });
    }

    if (now >= deadlineFor(exam, attempt)) {
      await finalizeAttempt(attempt, exam);

      return res.status(409).json({
        success: false,
        message: "Your exam time has ended.",
      });
    }

    return res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        deadline: deadlineFor(exam, attempt),
        exam: studentSafeExam(exam),
        answers: Object.fromEntries(attempt.answers || []),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function saveAnswersHandler(req, res, next) {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body || {};

    if (
      !validId(attemptId) ||
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt or answers.",
      });
    }

    const student = await getStudent(req);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      schoolId: req.user.schoolId,
      studentId: student._id,
      status: "in_progress",
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Active attempt not found or already submitted.",
      });
    }

    const exam = await getAttemptExam(
      attempt,
      req.user.schoolId
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    // Finalize expired attempts rather than leaving them stuck.
    if (new Date() >= deadlineFor(exam, attempt)) {
      const finalized = await finalizeAttempt(attempt, exam);

      return res.status(200).json({
        success: true,
        message: "The exam deadline passed. Your saved answers were submitted.",
        data: finalized,
      });
    }

    const updates = {};
    const questionIds = new Set(
      exam.questions.map((question) => String(question._id))
    );

    for (const [questionId, optionIndex] of Object.entries(answers)) {
      const question = exam.questions.id(questionId);

      if (
        !questionIds.has(questionId) ||
        !question ||
        !Number.isInteger(optionIndex) ||
        optionIndex < 0 ||
        optionIndex >= question.options.length
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more answers are invalid.",
        });
      }

      updates[`answers.${questionId}`] = optionIndex;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid answers were provided.",
      });
    }

    // Atomic update prevents saving answers to a submitted attempt.
    const updated = await ExamAttempt.findOneAndUpdate(
      {
        _id: attempt._id,
        schoolId: req.user.schoolId,
        studentId: student._id,
        status: "in_progress",
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("_id status updatedAt");

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "This attempt is no longer editable.",
      });
    }

    return res.json({
      success: true,
      message: "Answers saved successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitExamHandler(req, res, next) {
  try {
    const { attemptId } = req.params;

    if (!validId(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    const student = await getStudent(req);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      schoolId: req.user.schoolId,
      studentId: student._id,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found.",
      });
    }

    if (attempt.status === "submitted") {
      return res.status(200).json({
        success: true,
        message: "This exam was already submitted.",
        data: {
          _id: attempt._id,
          score: attempt.score,
          totalMarks: attempt.totalMarks,
          submittedAt: attempt.submittedAt,
          status: attempt.status,
        },
      });
    }

    const exam = await getAttemptExam(
      attempt,
      req.user.schoolId
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    // If the deadline has passed, submit the answers already saved
    // on the server. Do not reject and strand the attempt.
    const submitted = await finalizeAttempt(attempt, exam);

    if (!submitted) {
      return res.status(409).json({
        success: false,
        message: "Could not finalize this exam attempt.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam submitted successfully.",
      data: submitted,
    });
  } catch (error) {
    next(error);
  }
}

export async function listStudentExamsHandler(req, res, next) {
  try {
    const student = await getStudent(req);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    if (!student.classId) {
      return res.status(400).json({
        success: false,
        message: "No class has been assigned to this student.",
      });
    }

    const now = new Date();

    const exams = await Exam.find({
      schoolId: req.user.schoolId,
      classId: student.classId,
      status: "published",
      endsAt: { $gt: now },
    })
      .select("_id title instructions durationMinutes startsAt endsAt")
      .sort({ startsAt: 1 })
      .lean();

    const examIds = exams.map((exam) => exam._id);

    const attempts = examIds.length
      ? await ExamAttempt.find({
          schoolId: req.user.schoolId,
          studentId: student._id,
          examId: { $in: examIds },
        })
          .select("examId status startedAt submittedAt score totalMarks")
          .lean()
      : [];

    const attemptsByExam = new Map(
      attempts.map((attempt) => [
        String(attempt.examId),
        attempt,
      ])
    );

    const data = exams.map((exam) => {
      const attempt = attemptsByExam.get(String(exam._id));
      const startsAt = new Date(exam.startsAt);
      const endsAt = new Date(exam.endsAt);
      const isOpen = now >= startsAt && now < endsAt;

      let availability = "upcoming";

      if (isOpen) availability = "available";

      if (attempt?.status === "submitted") {
        availability = "submitted";
      } else if (attempt?.status === "in_progress") {
        availability = "in_progress";
      }

      return {
        _id: exam._id,
        title: exam.title,
        instructions: exam.instructions,
        durationMinutes: exam.durationMinutes,
        startsAt: exam.startsAt,
        endsAt: exam.endsAt,
        availability,
        attemptId: attempt?._id || null,
        startedAt: attempt?.startedAt || null,
        submittedAt: attempt?.submittedAt || null,
        score:
          attempt?.status === "submitted"
            ? attempt.score
            : null,
        totalMarks:
          attempt?.status === "submitted"
            ? attempt.totalMarks
            : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listExamResultsHandler(req, res, next) {
  try {
    const { examId } = req.params;
    const schoolId = req.user?.schoolId;

    if (!validId(examId)) {
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
    })
      .select("_id title classId subjectId sessionId termId")
      .populate("classId", "name level")
      .populate("subjectId", "name code")
      .lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    const attempts = await ExamAttempt.find({
      schoolId,
      examId: exam._id,
    })
      .populate(
        "studentId",
        "firstName middleName lastName admissionNumber"
      )
      .sort({ submittedAt: -1, startedAt: -1 })
      .lean();

    const results = attempts.map((attempt) => {
      const student =
        attempt.studentId &&
        typeof attempt.studentId === "object"
          ? attempt.studentId
          : null;

      const score =
        attempt.status === "submitted" &&
        typeof attempt.score === "number"
          ? attempt.score
          : null;

      const totalMarks = attempt.totalMarks ?? 0;

      const studentName = student
        ? [
            student.firstName,
            student.middleName,
            student.lastName,
          ]
            .filter(Boolean)
            .join(" ")
        : "Student record unavailable";

      return {
        attemptId: attempt._id,
        studentId: student?._id ?? null,
        studentName,
        admissionNumber: student?.admissionNumber ?? "",
        status: attempt.status,
        score,
        totalMarks,
        percentage:
          score !== null && totalMarks > 0
            ? Math.round((score / totalMarks) * 10000) / 100
            : null,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        exam,
        summary: {
          totalAttempts: results.length,
          submitted: results.filter(
            (item) => item.status === "submitted"
          ).length,
          inProgress: results.filter(
            (item) => item.status === "in_progress"
          ).length,
        },
        results,
      },
    });
  } catch (error) {
    next(error);
  }
}
