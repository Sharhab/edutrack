import { Result } from "./result.model.js";

export async function getStudentReportCard({
  studentId,
  sessionId,
  termId,
  schoolId,
}) {
  const results = await Result.find({
    studentId,
    sessionId,
    termId,
    schoolId,
  });

  let totalScore = 0;
  let subjectCount = results.length;

  const subjects = results.map((r) => {
    totalScore += r.total;

    return {
      subject: r.subjectId,
      total: r.total,
      grade: r.grade,
      remark: r.remark,
    };
  });

  const average =
    subjectCount === 0
      ? 0
      : totalScore / subjectCount;

  return {
    subjects,
    totalScore,
    average,
    position: null, // later computed
  };
}