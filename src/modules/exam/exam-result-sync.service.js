
import mongoose from "mongoose";

import { ApiError } from "../../utils/apiError.js";
import { Exam } from "./exam.model.js";
import { ExamAttempt } from "./attempt.model.js";
import { Result } from "../results/result.model.js";
import { getResultScheme } from "../results/result-scheme.service.js";
import {
  calculateDynamicResultFields,
} from "../results/assessment-calculation.service.js";
import {
  getSchoolGradeBands,
} from "../results/grading-scale.service.js";

/**
 * Convert a CBT score to the configured assessment component scale.
 *
 * Example:
 * CBT score: 40 / 50
 * Component maximum: 20
 * Converted score: 16 / 20
 */
function normalizeCbtScore(score, totalMarks, maxScore) {
  if (
    !Number.isFinite(Number(score)) ||
    !Number.isFinite(Number(totalMarks)) ||
    !Number.isFinite(Number(maxScore)) ||
    Number(totalMarks) <= 0 ||
    Number(maxScore) <= 0
  ) {
    throw new ApiError(
      400,
      "Invalid CBT score or assessment maximum."
    );
  }

  const normalized =
    (Number(score) / Number(totalMarks)) *
    Number(maxScore);

  return Math.round(normalized * 100) / 100;
}

function aggregateScores(scores, method) {
  if (!scores.length) {
    throw new ApiError(
      400,
      "No submitted CBT scores were found."
    );
  }

  if (method === "selected") {
    throw new ApiError(
      400,
      "This assessment uses selected-score aggregation. Automatic synchronization is not available until a score is selected."
    );
  }

  if (method === "highest") {
    return Math.max(...scores);
  }

  if (method === "average") {
    const average =
      scores.reduce((sum, score) => sum + score, 0) /
      scores.length;

    return Math.round(average * 100) / 100;
  }

  throw new ApiError(
    400,
    "Unsupported CBT aggregation method."
  );
}

/**
 * Synchronize submitted CBT attempts into one result component.
 *
 * All matching exams must have the same assessment snapshot.
 * Only the selected component is changed; other teacher-entered
 * assessment scores are preserved.
 */
export async function syncCbtResults({
  user,
  examId,
}) {
  const schoolId = user?.schoolId;
  const userId = user?._id || user?.id;

  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(
      401,
      "A valid school context is required."
    );
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(
      401,
      "Authenticated user is required."
    );
  }

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    throw new ApiError(
      400,
      "Invalid exam ID."
    );
  }

  const exam = await Exam.findOne({
    _id: examId,
    schoolId,
  }).lean();

  if (!exam) {
    throw new ApiError(
      404,
      "CBT exam not found in this school."
    );
  }

  if (
    !exam.assessmentKey ||
    !Number.isFinite(Number(exam.assessmentMaxScore)) ||
    !exam.assessmentSchemeVersion
  ) {
    throw new ApiError(
      400,
      "This CBT exam has no valid assessment snapshot. Recreate or configure the exam before synchronization."
    );
  }

  const aggregationMethod =
    exam.assessmentAggregationMethod || "average";

  if (aggregationMethod === "selected") {
    throw new ApiError(
      400,
      "This component requires manual score selection. Automatic synchronization is not available."
    );
  }

  // Find all exams in the same academic and assessment context.
  const matchingExams = await Exam.find({
    schoolId,
    classId: exam.classId,
    subjectId: exam.subjectId,
    sessionId: exam.sessionId,
    termId: exam.termId,
    assessmentKey: exam.assessmentKey,
  })
    .select(
      "_id assessmentKey assessmentMaxScore assessmentSchemeVersion assessmentAggregationMethod"
    )
    .lean();

  if (!matchingExams.length) {
    throw new ApiError(
      404,
      "No matching CBT exams were found."
    );
  }

  // Never combine exams created against different component settings.
  const inconsistentExam = matchingExams.find((item) => (
    Number(item.assessmentMaxScore) !==
      Number(exam.assessmentMaxScore) ||
    Number(item.assessmentSchemeVersion) !==
      Number(exam.assessmentSchemeVersion) ||
    (item.assessmentAggregationMethod || "average") !==
      aggregationMethod
  ));

  if (inconsistentExam) {
    throw new ApiError(
      409,
      "Matching CBT exams use different assessment settings. Synchronize them separately or resolve the assessment configuration first."
    );
  }

  const matchingExamIds = matchingExams.map(
    (item) => item._id
  );

  const attempts = await ExamAttempt.find({
    schoolId,
    examId: { $in: matchingExamIds },
    status: "submitted",
    score: { $ne: null },
    totalMarks: { $gt: 0 },
  })
    .select("studentId examId score totalMarks")
    .lean();

  if (!attempts.length) {
    throw new ApiError(
      400,
      "No submitted CBT attempts are available to synchronize."
    );
  }

  // Resolve the current scheme for the class.
  const resolved = await getResultScheme(user, {
    classId: String(exam.classId),
  });

  if (!resolved?.scheme) {
    throw new ApiError(
      400,
      "No result assessment scheme is configured for this class."
    );
  }

  if (
    Number(resolved.scheme.version) !==
    Number(exam.assessmentSchemeVersion)
  ) {
    throw new ApiError(
      409,
      "The result assessment scheme has changed since this CBT exam was created. Review the scheme before synchronizing."
    );
  }

  const component = (resolved.scheme.components || []).find(
    (item) =>
      item.enabled !== false &&
      item.key === exam.assessmentKey
  );

  if (
    !component ||
    Number(component.maxScore) !==
      Number(exam.assessmentMaxScore)
  ) {
    throw new ApiError(
      409,
      "The CBT assessment component no longer matches the configured result scheme."
    );
  }

  const gradeBands = await getSchoolGradeBands(schoolId);

  // Group submitted attempts by student.
  const attemptsByStudent = new Map();

  for (const attempt of attempts) {
    const studentKey = String(attempt.studentId);

    if (!attemptsByStudent.has(studentKey)) {
      attemptsByStudent.set(studentKey, []);
    }

    attemptsByStudent.get(studentKey).push(attempt);
  }

  const studentIds = [...attemptsByStudent.keys()];

  const existingResults = await Result.find({
    schoolId,
    classId: exam.classId,
    subjectId: exam.subjectId,
    sessionId: exam.sessionId,
    termId: exam.termId,
    studentId: { $in: studentIds },
  }).lean();

  const resultsByStudent = new Map(
    existingResults.map((result) => [
      String(result.studentId),
      result,
    ])
  );

  const synced = [];
  const skipped = [];

  for (const [studentId, studentAttempts] of attemptsByStudent) {
    const existing = resultsByStudent.get(studentId);

    if (
      existing &&
      ["published", "locked"].includes(existing.status)
    ) {
      skipped.push({
        studentId,
        reason: `Result is ${existing.status}.`,
      });
      continue;
    }

    // Use the result's saved scheme if it already exists.
    // Otherwise use the current resolved scheme.
    const schemeSnapshot =
      existing?.assessmentScheme?.components?.length
        ? existing.assessmentScheme
        : resolved.scheme;

    const snapshotComponent = (
      schemeSnapshot.components || []
    ).find(
      (item) =>
        item.key === exam.assessmentKey
    );

    if (
      !snapshotComponent ||
      Number(snapshotComponent.maxScore) !==
        Number(exam.assessmentMaxScore)
    ) {
      skipped.push({
        studentId,
        reason:
          "Existing result uses a different assessment component configuration.",
      });
      continue;
    }

    const convertedScores = studentAttempts.map(
      (attempt) =>
        normalizeCbtScore(
          attempt.score,
          attempt.totalMarks,
          exam.assessmentMaxScore
        )
    );

    const componentScore = aggregateScores(
      convertedScores,
      aggregationMethod
    );

    const currentScores =
      existing?.scores instanceof Map
        ? Object.fromEntries(existing.scores.entries())
        : existing?.scores &&
            typeof existing.scores === "object"
          ? { ...existing.scores }
          : {};

    // Preserve all other assessment component scores.
    currentScores[exam.assessmentKey] = componentScore;

    const calculated = calculateDynamicResultFields({
      scores: currentScores,
      scheme: schemeSnapshot,
      gradeBands,
    });

    const update = {
      $set: {
        schoolId,
        studentId,
        classId: exam.classId,
        subjectId: exam.subjectId,
        sessionId: exam.sessionId,
        termId: exam.termId,

        scores: calculated.scores,
        assessmentScheme: calculated.assessmentScheme,

        ca1: calculated.ca1,
        ca2: calculated.ca2,
        assignment: calculated.assignment,
        exam: calculated.exam,

        total: calculated.total ?? 0,
        grade: calculated.grade,
        remark: calculated.remark,

        status: "draft",
        enteredBy: userId,
      },
    };

    if (existing) {
      const updated = await Result.findOneAndUpdate(
        {
          _id: existing._id,
          schoolId,
          status: { $nin: ["published", "locked"] },
        },
        update,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updated) {
        skipped.push({
          studentId,
          reason:
            "Result became published or locked during synchronization.",
        });
        continue;
      }
    } else {
      try {
        await Result.create({
          ...update.$set,
        });
      } catch (error) {
        // A concurrent result creation may have won the unique index.
        if (error.code === 11000) {
          skipped.push({
            studentId,
            reason:
              "A result was created concurrently. Retry synchronization.",
          });
          continue;
        }

        throw error;
      }
    }

    synced.push({
      studentId,
      componentKey: exam.assessmentKey,
      score: componentScore,
      maxScore: exam.assessmentMaxScore,
      attemptsUsed: studentAttempts.length,
    });
  }

  return {
    success: true,
    examId: exam._id,
    assessmentKey: exam.assessmentKey,
    aggregationMethod,
    syncedCount: synced.length,
    skippedCount: skipped.length,
    synced,
    skipped,
  };
}
