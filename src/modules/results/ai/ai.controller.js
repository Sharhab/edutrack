import { runAIResultEngine } from "./ai.engine.service.js";

export async function getAIResultDashboard(req, res) {
  const data = await runAIResultEngine({
    schoolId: req.user.schoolId,
    sessionId: req.query.sessionId,
    termId: req.query.termId,
  });

  res.json({
    success: true,
    data,
  });
}