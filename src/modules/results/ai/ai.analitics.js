import { getRiskLevel } from "./ai.risk.js";
import { getTrend } from "./ai.trend.js";

export function buildStudentAnalytics(results) {
  const map = {};

  for (const r of results) {
    const id = String(r.studentId?._id);

    if (!map[id]) {
      map[id] = {
        studentId: id,
        name: `${r.studentId?.firstName || ""} ${r.studentId?.lastName || ""}`,
        total: 0,
        count: 0,
        scores: [],
      };
    }

    map[id].total += r.total || 0;
    map[id].count += 1;
    map[id].scores.push(r.total || 0);
  }

  return Object.values(map).map((student) => {
    const avg = student.total / student.count;

    return {
      ...student,
      average: avg,
      trend: getTrend(student.scores),
      riskLevel: getRiskLevel(avg),
      promotionProbability: getPromotionProbability(avg),
    };
  });
}

export function generateSummary(analytics) {
  const total = analytics.length;

  const atRisk = analytics.filter(s => s.riskLevel === "HIGH").length;
  const critical = analytics.filter(s => s.riskLevel === "CRITICAL").length;

  const avg =
    analytics.reduce((sum, s) => sum + s.average, 0) / total;

  return {
    totalStudents: total,
    atRisk,
    critical,
    averagePerformance: Number(avg.toFixed(2)),
  };
}