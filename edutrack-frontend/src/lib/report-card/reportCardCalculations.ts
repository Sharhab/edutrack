/* =========================================
   CLASS STATISTICS (FOR CLASS PDF)
========================================= */

import { RankingStudent } from "../../types/report-card";

/**
 * Calculate class-level performance stats
 */
export function calculateClassStatistics(students: RankingStudent[]) {
  if (!students.length) {
    return {
      highestAverage: 0,
      lowestAverage: 0,
      classAverage: 0,
      excellentCount: 0,
      passCount: 0,
      failCount: 0,
    };
  }

  const averages = students.map((s) => s.averageScore || 0);

  const highestAverage = Math.max(...averages);
  const lowestAverage = Math.min(...averages);

  const classAverage =
    averages.reduce((a, b) => a + b, 0) / averages.length;

  const excellentCount = students.filter(
    (s) => s.averageScore >= 75
  ).length;

  const passCount = students.filter(
    (s) => s.averageScore >= 50
  ).length;

  const failCount = students.filter(
    (s) => s.averageScore < 50
  ).length;

  return {
    highestAverage: Number(highestAverage.toFixed(2)),
    lowestAverage: Number(lowestAverage.toFixed(2)),
    classAverage: Number(classAverage.toFixed(2)),
    excellentCount,
    passCount,
    failCount,
  };
}

/* =========================================
   PERFORMANCE REMARK (FOR PDF)
========================================= */

export function getPerformanceRemark(score: number) {
  if (score >= 75) return "Excellent";
  if (score >= 65) return "Very Good";
  if (score >= 50) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Improvement";
}

import { AttendanceSummary } from "../../types/report-card";

/* =========================================
   ATTENDANCE CALCULATION (FIXED MISSING EXPORT)
========================================= */

export function calculateAttendancePercentage(
  attendance: AttendanceSummary
): number {
  if (!attendance || !attendance.total) return 0;

  const percentage =
    (attendance.present / attendance.total) * 100;

  return Number(percentage.toFixed(2));
}