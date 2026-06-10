import { ApiError } from "../../utils/apiError.js";
import {
  generateTerminalResults,
} from "./terminal.service.js";
import { Result } from "./result.model.js";

/**
 * GENERATE TERMINAL RESULTS (CLASS)
 */
export async function generateTerminalResultsHandler(req, res) {
  const { classId, sessionId, termId } = req.body;

  if (!classId || !sessionId || !termId) {
    throw new ApiError(400, "classId, sessionId and termId are required");
  }

  const result = await generateTerminalResults({
    schoolId: req.user.schoolId,
    classId,
    sessionId,
    termId,
  });

  res.json(result);
}

/**
 * GET TERMINAL RESULTS FOR CLASS
 */
export async function getTerminalResultsHandler(req, res) {
  const { classId, sessionId, termId } = req.params;

  const result = await generateTerminalResults({
    schoolId: req.user.schoolId,
    classId,
    sessionId,
    termId,
  });

  res.json(result);
}

/**
 * ADMIN SUMMARY (PROGRESS TRACKING)
 * - how many students have results
 * - how many subjects completed
 * - draft vs completed
 */
export async function getTerminalSummaryHandler(req, res) {
  const { classId, sessionId, termId } = req.params;

  const results = await Result.find({
    schoolId: req.user.schoolId,
    classId,
    sessionId,
    termId,
  });

  const totalRecords = results.length;

  const drafted = results.filter(r => r.status === "draft").length;
  const completed = results.filter(r => r.status === "completed").length;

  const students = new Set(results.map(r => r.studentId.toString())).size;

  const subjects = new Set(results.map(r => r.subjectId.toString())).size;

  res.json({
    success: true,
    data: {
      totalRecords,
      drafted,
      completed,
      students,
      subjects,
      progress:
        totalRecords === 0
          ? 0
          : Math.round((completed / totalRecords) * 100),
    },
  });
}

/**
 * OPTIONAL: QUICK CHECK ENDPOINT
 */
export async function checkTerminalReadyHandler(req, res) {
  const { classId, sessionId, termId } = req.params;

  const count = await Result.countDocuments({
    schoolId: req.user.schoolId,
    classId,
    sessionId,
    termId,
  });

  res.json({
    success: true,
    ready: count > 0,
    total: count,
  });
}