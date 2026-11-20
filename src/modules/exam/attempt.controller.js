
import mongoose from "mongoose";

import { Exam } from "./exam.model.js";
import { ExamAttempt } from "./attempt.model.js";
import { Student } from "../students/student.model.js";

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

/* =========================================================
   STUDENT AUTHENTICATION
========================================================= */

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

/* =========================================================
   DETERMINISTIC SHUFFLING
========================================================= */

function createSeededRandom(seed) {
  let value = 2166136261;

  for (let i = 0; i < seed.length; i++) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }

  return function random() {
    value += 0x6D2B79F5;

    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledIndexes(length, seed) {
  const indexes = Array.from(
    { length },
    (_, index) => index
  );

  const random = createSeededRandom(seed);

  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));

    [indexes[i], indexes[j]] = [
      indexes[j],
      indexes[i],
    ];
  }

  return indexes;
}

function getQuestionOrder(exam, attemptId) {
  if (!exam.shuffleQuestions) {
    return exam.questions.map((_, index) => index);
  }

  return shuffledIndexes(
    exam.questions.length,
    `${attemptId}:questions`
  );
}

function getOptionOrder(exam, attemptId, question) {
  const count = question.options.length;

  if (!exam.shuffleOptions) {
    return Array.from(
      { length: count },
      (_, index) => index
    );
  }

  return shuffledIndexes(
    count,
    `${attemptId}:${question._id}:options`
  );
}

/* =========================================================
   STUDENT-SAFE EXAM RESPONSE
========================================================= */

/**
 * Correct answers are never returned to students.
 * Question and option ordering is deterministic per attempt.
 */
function studentSafeExam(exam, attemptId) {
  const questionOrder = getQuestionOrder(
    exam,
    String(attemptId)
  );

  return {
    _id: exam._id,
    title: exam.title,
    instructions: exam.instructions,
    durationMinutes: exam.durationMinutes,
    startsAt: exam.startsAt,
    endsAt: exam.endsAt,

    questions: questionOrder.map((originalIndex) => {
      const question = exam.questions[originalIndex];

      const optionOrder = getOptionOrder(
        exam,
        String(attemptId),
        question
      );

      return {
        _id: question._id,
        text: question.text,

        options: optionOrder.map(
          (optionIndex) => question.options[optionIndex]
        ),

        marks: question.marks,
      };
    }),
  };
}

/**
 * Convert original stored answers into the indexes
 * displayed to the student.
 */
function answersForStudent(exam, attempt) {
  const result = {};

  for (const question of exam.questions) {
    const questionId = String(question._id);

    const originalIndex = attempt.answers?.get
      ? attempt.answers.get(questionId)
      : attempt.answers?.[questionId];

    if (!Number.isInteger(originalIndex)) {
      continue;
    }

    const optionOrder = getOptionOrder(
      exam,
      String(attempt._id),
      question
    );

    const displayedIndex =
      optionOrder.indexOf(originalIndex);

    if (displayedIndex !== -1) {
      result[questionId] = displayedIndex;
    }
  }

  return result;
}

/**
 * Convert student-facing displayed answers back
 * into original exam option indexes.
 */
function convertAnswersToOriginal(exam, attempt, answers) {
  const updates = {};
  const questionIds = new Set(
    exam.questions.map((question) => String(question._id))
  );

  for (const [questionId, displayedIndex] of Object.entries(answers)) {
    if (!validId(questionId) || !questionIds.has(questionId)) {
      return {
        error: "One or more question IDs are invalid.",
      };
    }

    const question = exam.questions.id(questionId);

    if (
      !question ||
      !Number.isInteger(displayedIndex) ||
      displayedIndex < 0 ||
      displayedIndex >= question.options.length
    ) {
      return {
        error: "One or more selected answers are invalid.",
      };
    }

    const optionOrder = getOptionOrder(
      exam,
      String(attempt._id),
      question
    );

    const originalIndex = optionOrder[displayedIndex];

    if (!Number.isInteger(originalIndex)) {
      return {
        error: "Could not validate a selected answer.",
      };
    }

    updates[`answers.${questionId}`] = originalIndex;
  }

  if (Object.keys(updates).length === 0) {
    return {
      error: "No valid answers were provided.",
    };
  }

  return { updates };
}

/* =========================================================
   EXAM DEADLINE
========================================================= */

function deadlineFor(exam, attempt) {
  const examDeadline = new Date(exam.endsAt).getTime();

  const attemptDeadline =
    new Date(attempt.startedAt).getTime() +
    Number(exam.durationMinutes) * 60_000;

  return new Date(
    Math.min(examDeadline, attemptDeadline)
  );
}

async function getAttemptExam(attempt, schoolId) {
  return Exam.findOne({
    _id: attempt.examId,
    schoolId,
    classId: attempt.studentClassId,
  });
}

/* =========================================================
   AUTOMATIC MARKING
========================================================= */

function calculateScore(exam, answers) {
  let score = 0;

  for (const question of exam.questions) {
    const questionId = String(question._id);

    const selected = answers?.get
      ? answers.get(questionId)
      : answers?.[questionId];

    if (
      Number.isInteger(selected) &&
      selected === question.correctOptionIndex
    ) {
      score += Number(question.marks || 0);
    }
  }

  const totalMarks = exam.questions.reduce(
    (total, question) =>
      total + Number(question.marks || 0),
    0
  );

  return {
    score,
    totalMarks,
  };
}

/**
 * Finalizes an attempt exactly once.
 *
 * The database always stores original option indexes.
 * Marking therefore remains correct regardless of shuffling.
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
  ).select(
    "_id score totalMarks submittedAt status"
  );

  if (submitted) {
    return submitted;
  }

  // Another request may have finalized the attempt.
  return ExamAttempt.findOne({
    _id: attempt._id,
    schoolId: attempt.schoolId,
    studentId: attempt.studentId,
    examId: attempt.examId,
  }).select(
    "_id score totalMarks submittedAt status"
  );
}

/* =========================================================
   START OR RESUME EXAM
========================================================= */

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

    // Resume existing attempts even if the exam was closed.
    if (attempt?.status === "in_progress") {
      const deadline = deadlineFor(exam, attempt);

      if (now >= deadline) {
        await finalizeAttempt(attempt, exam);

        return res.status(409).json({
          success: false,
          message:
            "Your exam time has ended and your attempt was submitted.",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          attemptId: attempt._id,
          deadline,
          exam: studentSafeExam(exam, attempt._id),
          answers: answersForStudent(exam, attempt),
        },
      });
    }

    // New attempts require a published exam and valid schedule.
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
      if (error.code !== 11000) {
        throw error;
      }

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

    const deadline = deadlineFor(exam, attempt);

    if (now >= deadline) {
      await finalizeAttempt(attempt, exam);

      return res.status(409).json({
        success: false,
        message: "Your exam time has ended.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        deadline,
        exam: studentSafeExam(exam, attempt._id),
        answers: answersForStudent(exam, attempt),
      },
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   SAVE STUDENT ANSWERS
========================================================= */

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

    const exam = await Exam.findOne({
      _id: attempt.examId,
      schoolId: req.user.schoolId,
      classId: student.classId,
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    // Expired attempts are finalized using already saved answers.
    if (new Date() >= deadlineFor(exam, attempt)) {
      const finalized = await finalizeAttempt(attempt, exam);

      return res.status(200).json({
        success: true,
        message:
          "The exam deadline passed. Your saved answers were submitted.",
        data: finalized,
      });
    }

    const converted = convertAnswersToOriginal(
      exam,
      attempt,
      answers
    );

    if (converted.error) {
      return res.status(400).json({
        success: false,
        message: converted.error,
      });
    }

    // Do not permit updates to an attempt already submitted.
    const updated = await ExamAttempt.findOneAndUpdate(
      {
        _id: attempt._id,
        schoolId: req.user.schoolId,
        studentId: student._id,
        status: "in_progress",
      },
      {
        $set: converted.updates,
      },
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

    return res.status(200).json({
      success: true,
      message: "Answers saved successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================================
   SUBMIT EXAM
========================================================= */

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

    const exam = await Exam.findOne({
      _id: attempt.examId,
      schoolId: req.user.schoolId,
      classId: student.classId,
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    // Finalization is allowed for both early submissions
    // and expired attempts.
    const submitted = await finalizeAttempt(
      attempt,
      exam
    );

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

/* =========================================================
   LIST STUDENT EXAMS
========================================================= */

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

    // Include published exams and closed exams where this
    // student already has an attempt to resume or review.
    const existingAttempts = await ExamAttempt.find({
      schoolId: req.user.schoolId,
      studentId: student._id,
    })
      .select("examId status startedAt submittedAt score totalMarks")
      .lean();

    const attemptedExamIds = existingAttempts.map(
      (attempt) => attempt.examId
    );

    const exams = await Exam.find({
      schoolId: req.user.schoolId,
      classId: student.classId,
      $or: [
        {
          status: "published",
          endsAt: { $gt: now },
        },
        {
          _id: { $in: attemptedExamIds },
        },
      ],
    })
      .select(
        "_id title instructions durationMinutes startsAt endsAt status"
      )
      .sort({ startsAt: 1 })
      .lean();

    const attemptsByExam = new Map(
      existingAttempts.map((attempt) => [
        String(attempt.examId),
        attempt,
      ])
    );

    const data = exams.map((exam) => {
      const attempt = attemptsByExam.get(
        String(exam._id)
      );

      const startsAt = new Date(exam.startsAt);
      const endsAt = new Date(exam.endsAt);

      let availability = "upcoming";

      if (
        exam.status === "published" &&
        now >= startsAt &&
        now < endsAt
      ) {
        availability = "available";
      }

      if (attempt?.status === "in_progress") {
        availability = "in_progress";
      }

      if (attempt?.status === "submitted") {
        availability = "submitted";
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

/* =========================================================
   ADMIN EXAM RESULTS
========================================================= */

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
      .sort({
        submittedAt: -1,
        startedAt: -1,
      })
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
        admissionNumber:
          student?.admissionNumber ?? "",

        status: attempt.status,
        score,
        totalMarks,

        percentage:
          score !== null && totalMarks > 0
            ? Math.round(
                (score / totalMarks) * 10000
              ) / 100
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

/* =========================================================
   ADMIN REVIEW STUDENT EXAM ANSWERS
   GET /:examId/attempts/:attemptId/review
========================================================= */

export async function reviewExamAttemptHandler(req, res, next) {
  try {
    const { examId, attemptId } = req.params;
    const schoolId = req.user?.schoolId;

    if (!validId(examId) || !validId(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam or attempt ID.",
      });
    }

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School context is missing.",
      });
    }

    // Only retrieve an exam belonging to this school.
    const exam = await Exam.findOne({
      _id: examId,
      schoolId,
    })
      .select("_id title questions classId subjectId")
      .populate("classId", "name level")
      .populate("subjectId", "name code")
      .lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    // Attempt must belong to this school and this exam.
    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      examId: exam._id,
      schoolId,
    })
      .populate(
        "studentId",
        "firstName middleName lastName admissionNumber"
      )
      .lean();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Student exam attempt not found.",
      });
    }

    if (attempt.status !== "submitted") {
      return res.status(409).json({
        success: false,
        message: "Only submitted attempts can be reviewed.",
      });
    }

    const student =
      attempt.studentId &&
      typeof attempt.studentId === "object"
        ? attempt.studentId
        : null;

    // Mongoose Map values may appear as a Map or plain object.
    const answers =
      attempt.answers instanceof Map
        ? Object.fromEntries(attempt.answers)
        : attempt.answers || {};

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const questions = exam.questions.map((question, index) => {
      const questionId = String(question._id);
      const selectedIndex = answers[questionId];

      const hasAnswer =
        Number.isInteger(selectedIndex) &&
        selectedIndex >= 0 &&
        selectedIndex < question.options.length;

      const isCorrect =
        hasAnswer &&
        selectedIndex === question.correctOptionIndex;

      const marksAwarded = isCorrect
        ? Number(question.marks || 0)
        : 0;

      if (!hasAnswer) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        questionId,
        questionNumber: index + 1,
        questionText: question.text,

        options: question.options.map((option, optionIndex) => ({
          index: optionIndex,
          text: option,
          isCorrect: optionIndex === question.correctOptionIndex,
          isSelected: hasAnswer && optionIndex === selectedIndex,
        })),

        selectedAnswer: hasAnswer
          ? question.options[selectedIndex]
          : null,

        correctAnswer:
          question.options[question.correctOptionIndex],

        selectedOptionIndex: hasAnswer
          ? selectedIndex
          : null,

        correctOptionIndex: question.correctOptionIndex,

        isCorrect: hasAnswer ? isCorrect : false,
        marks: Number(question.marks || 0),
        marksAwarded,
      };
    });

    const totalQuestions = questions.length;
    const score = Number(attempt.score ?? 0);
    const totalMarks = Number(attempt.totalMarks ?? 0);

    return res.status(200).json({
      success: true,
      message: "Exam answer review loaded successfully.",
      data: {
        exam: {
          _id: exam._id,
          title: exam.title,
          class: exam.classId,
          subject: exam.subjectId,
        },

        student: {
          _id: student?._id ?? null,
          name: student
            ? [
                student.firstName,
                student.middleName,
                student.lastName,
              ].filter(Boolean).join(" ")
            : "Student record unavailable",
          admissionNumber: student?.admissionNumber ?? "",
        },

        attempt: {
          _id: attempt._id,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          score,
          totalMarks,
          percentage:
            totalMarks > 0
              ? Math.round((score / totalMarks) * 10000) / 100
              : 0,
        },

        summary: {
          totalQuestions,
          correctCount,
          wrongCount,
          unansweredCount,
        },

        questions,
      },
    });
  } catch (error) {
    next(error);
  }
}


