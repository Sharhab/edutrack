import mongoose from "mongoose";

import { ApiError } from "../../utils/apiError.js";

import {
  generateCumulativeStudentReport,
  generateCumulativeClassReport,
} from "./cumulative-report.service.js";

/* =========================================
   STUDENT CUMULATIVE REPORT
========================================= */

export async function cumulativeStudentReportHandler(req, res) {
  const { studentId } = req.params;
  const { sessionId } = req.query;

  if (
    !sessionId ||
    !mongoose.Types.ObjectId.isValid(sessionId)
  ) {
    throw new ApiError(
      400,
      "A valid sessionId query parameter is required"
    );
  }

  const data = await generateCumulativeStudentReport({
    user: req.user,
    studentId,
    sessionId,
  });

  return res.status(200).json({
    success: true,
    report: data.report,
  });
}

/* =========================================
   CLASS CUMULATIVE REPORT
========================================= */

export async function cumulativeClassReportHandler(req, res) {
  const { classId } = req.params;
  const { sessionId } = req.query;

  if (
    !sessionId ||
    !mongoose.Types.ObjectId.isValid(sessionId)
  ) {
    throw new ApiError(
      400,
      "A valid sessionId query parameter is required"
    );
  }

  const data = await generateCumulativeClassReport({
    user: req.user,
    classId,
    sessionId,
  });

  return res.status(200).json({
    success: true,
    ...data,
  });
}
