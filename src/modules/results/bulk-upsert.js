import { computeGrade } from "./grade.utils.js";
import { Result } from "./result.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ensureTeacherCanEnter } from "./result.service.js";


export async function bulkUpsertResults({
  schoolId,
  classId,
  subjectId,
  sessionId,
  termId,
  results,
  user,
}) {
  if (!Array.isArray(results)) {
    throw new ApiError(400, "Results must be an array");
  }

  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  // FIXED validation
await ensureTeacherCanEnter({
  teacherId: user.id,
  schoolId,
  classId,
  subjectId,
});

  const operations = results.map((r) => {
    const ca1 = Number(r.ca1 || 0);
    const ca2 = Number(r.ca2 || 0);
    const assignment = Number(r.assignment || 0);
    const exam = Number(r.exam || 0);

    const total = ca1 + ca2 + assignment + exam;
    const { grade, remark } = computeGrade(total);

    return {
      updateOne: {
        filter: {
          schoolId,
          studentId: r.studentId,
          subjectId,
          sessionId,
          termId,
        },
        update: {
          $set: {
            schoolId,
            studentId: r.studentId,
            classId,
            subjectId,
            sessionId,
            termId,
            ca1,
            ca2,
            assignment,
            exam,
            total,
            grade,
            remark,
            status: "draft",
            enteredBy: user._id,
          },
        },
        upsert: true,
      },
    };
  });

  await Result.bulkWrite(operations);

  return {
    success: true,
    updated: operations.length,
  };
}