
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
    questions: exam.questions.map((q) => ({
      _id: q._id,
      text: q.text,
      options: q.options,
      marks: q.marks,
    })),
  };
}


async function getStudent(req) {
  // Student login accounts are linked through User.studentId.
  // The protect middleware loads the authenticated User document
  // into req.user, so we can use its trusted studentId.
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

    const now = new Date();

    const exam = await Exam.findOne({
      _id: examId,
      schoolId: req.user.schoolId,
      classId: student.classId,
      status: "published",
      startsAt: { $lte: now },
      endsAt: { $gt: now },
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam is unavailable or not open for your class.",
      });
    }

    let attempt;

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
              (sum, q) => sum + q.marks,
              0
            ),
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
    } catch (error) {
      // Concurrent start requests may race against the unique index.
      if (error.code !== 11000) throw error;

      attempt = await ExamAttempt.findOne({
        schoolId: req.user.schoolId,
        examId: exam._id,
        studentId: student._id,
      });
    }

    if (attempt.status === "submitted") {
      return res.status(409).json({
        success: false,
        message: "This exam has already been submitted.",
      });
    }

    if (new Date() >= deadlineFor(exam, attempt)) {
      return res.status(403).json({
        success: false,
        message: "The exam deadline has passed.",
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
    const { answers } = req.body;

    if (!validId(attemptId) || !answers || typeof answers !== "object" ||
        Array.isArray(answers)) {
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
        message: "Active attempt not found.",
      });
    }

    const exam = await Exam.findOne({
      _id: attempt.examId,
      schoolId: req.user.schoolId,
      status: "published",
    });

    if (!exam || new Date() >= deadlineFor(exam, attempt)) {
      return res.status(403).json({
        success: false,
        message: "The exam deadline has passed.",
      });
    }

    const questionIds = new Set(
      exam.questions.map((q) => String(q._id))
    );

    for (const [questionId, optionIndex] of Object.entries(answers)) {
      const question = exam.questions.id(questionId);

      if (
        !questionIds.has(questionId) ||
        !Number.isInteger(optionIndex) ||
        optionIndex < 0 ||
        optionIndex >= question.options.length
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more answers are invalid.",
        });
      }

      attempt.answers.set(questionId, optionIndex);
    }

    await attempt.save();

    return res.json({
      success: true,
      message: "Answers saved.",
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
      status: "in_progress",
    });

    if (!attempt) {
      return res.status(409).json({
        success: false,
        message: "Attempt not found or already submitted.",
      });
    }

    const exam = await Exam.findOne({
      _id: attempt.examId,
      schoolId: req.user.schoolId,
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    const now = new Date();

    // Do not accept submissions after the deadline.
    if (now >= deadlineFor(exam, attempt)) {
      return res.status(403).json({
        success: false,
        message: "The exam deadline has passed.",
      });
    }

    let score = 0;
    const totalMarks = exam.questions.reduce(
      (sum, q) => sum + q.marks,
      0
    );

    for (const question of exam.questions) {
      const selected = attempt.answers.get(String(question._id));

      if (selected === question.correctOptionIndex) {
        score += question.marks;
      }
    }

    // Atomic status transition: only one concurrent submission wins.
    const submitted = await ExamAttempt.findOneAndUpdate(
      {
        _id: attempt._id,
        schoolId: req.user.schoolId,
        studentId: student._id,
        status: "in_progress",
      },
      {
        $set: {
          score,
          totalMarks,
          submittedAt: now,
          status: "submitted",
        },
      },
      { new: true, runValidators: true }
    ).select("_id score totalMarks submittedAt status");

    if (!submitted) {
      return res.status(409).json({
        success: false,
        message: "Attempt has already been submitted.",
      });
    }

    return res.json({
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

    // Only published exams belonging to this student's school and class.
    // Keep upcoming exams visible, but exclude exams whose end time passed.
    const exams = await Exam.find({
      schoolId: req.user.schoolId,
      classId: student.classId,
      status: "published",
      endsAt: { $gt: now },
    })
      .select(
        "_id title instructions durationMinutes startsAt endsAt"
      )
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

      if (isOpen) {
        availability = "available";
      }

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
        score: attempt?.status === "submitted"
          ? attempt.score
          : null,
        totalMarks: attempt?.status === "submitted"
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

    if (!mongoose.Types.ObjectId.isValid(examId)) {
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

    // Confirm the exam belongs to the authenticated school.
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
      .populate("studentId", "firstName lastName admissionNumber")
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

      return {
        attemptId: attempt._id,
        studentId: student?._id ?? null,
        studentName: student
          ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
          : "Student record unavailable",
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



