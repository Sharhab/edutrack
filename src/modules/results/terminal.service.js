import { Result } from "./result.model.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * Generate terminal results for a class
 */
export async function generateTerminalResults({
  schoolId,
  classId,
  sessionId,
  termId,
}) {
  if (!schoolId || !classId || !sessionId || !termId) {
    throw new ApiError(400, "Missing required parameters");
  }

  // 1. Fetch all results for class
  const results = await Result.find({
    schoolId,
    classId,
    sessionId,
    termId,
  }).populate("studentId subjectId");

  if (!results.length) {
    throw new ApiError(404, "No results found for this class");
  }

  // 2. Group by student
  const studentMap = new Map();

  for (const r of results) {
    const studentId = r.studentId._id.toString();

    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        studentId: r.studentId._id,
        studentName: `${r.studentId.firstName} ${r.studentId.lastName}`,
        subjects: [],
        totalScore: 0,
        subjectCount: 0,
      });
    }

    const student = studentMap.get(studentId);

    student.subjects.push({
      subjectId: r.subjectId?._id,
      subjectName: r.subjectId?.name,
      total: r.total,
      grade: r.grade,
      remark: r.remark,
    });

    student.totalScore += r.total;
    student.subjectCount += 1;
  }

  // 3. Convert to array
  let terminalResults = Array.from(studentMap.values());

  // 4. Compute averages
  terminalResults = terminalResults.map((s) => ({
    ...s,
    average: s.subjectCount
      ? (s.totalScore / s.subjectCount).toFixed(2)
      : 0,
  }));

  // 5. Sort for ranking (DESC)
  terminalResults.sort((a, b) => b.totalScore - a.totalScore);

  // 6. Assign positions
  terminalResults = terminalResults.map((s, index) => ({
    ...s,
    position: index + 1,
  }));

  return {
    success: true,
    classId,
    sessionId,
    termId,
    totalStudents: terminalResults.length,
    data: terminalResults,
  };
}