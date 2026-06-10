import { Result } from "../result.model.js";
import { buildStudentAnalytics } from "./ai.analytics.js";
import { generateSummary } from "./ai.analytics.js";

export async function runAIResultEngine({
  schoolId,
  sessionId,
  termId,
}) {
  const filter = { schoolId };

  if (sessionId) filter.sessionId = sessionId;
  if (termId) filter.termId = termId;

  const results = await Result.find(filter)
    .populate("studentId", "firstName lastName")
    .populate("classId", "name")
    .lean();

  const analytics = buildStudentAnalytics(results);

  return {
    summary: generateSummary(analytics),
    atRiskStudents: analytics.filter(s => s.riskLevel === "HIGH"),
    topPerformers: analytics
      .sort((a, b) => b.average - a.average)
      .slice(0, 10),
    students: analytics,
  };
}