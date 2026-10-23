
import { RankingStudent, AttendanceSummary } from "../../types/report-card";

export function calculateClassStatistics(students: RankingStudent[]) {
  const validStudents = students.filter(
    (student) =>
      student.averageScore !== null &&
      Number.isFinite(student.averageScore) &&
      student.averageScore >= 0
  );

  if (validStudents.length === 0) {
    return {
      highestAverage: null,
      lowestAverage: null,
      classAverage: null,
      excellentCount: 0,
      passCount: 0,
      failCount: 0,
    };
  }

  const averages = validStudents
    .map((student) => student.averageScore)
    .filter((score): score is number => score !== null);

  const highestAverage = Math.max(...averages);
  const lowestAverage = Math.min(...averages);

  const classAverage =
    averages.reduce((sum, score) => sum + score, 0) /
    averages.length;

  return {
    highestAverage: Number(highestAverage.toFixed(2)),
    lowestAverage: Number(lowestAverage.toFixed(2)),
    classAverage: Number(classAverage.toFixed(2)),
    excellentCount: validStudents.filter(
      (student) => student.averageScore !== null && student.averageScore >= 75
    ).length,
    passCount: validStudents.filter(
      (student) => student.averageScore !== null && student.averageScore >= 50
    ).length,
    failCount: validStudents.filter(
      (student) => student.averageScore !== null && student.averageScore < 50
    ).length,
  };
}

export function getPerformanceRemark(score: number) {
  if (score >= 75) return "Excellent";
  if (score >= 65) return "Very Good";
  if (score >= 50) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Improvement";
}

export function calculateAttendancePercentage(
  attendance: AttendanceSummary
): number {
  if (!attendance || !attendance.total) return 0;

  const percentage =
    (attendance.present / attendance.total) * 100;

  return Number(percentage.toFixed(2));
}
