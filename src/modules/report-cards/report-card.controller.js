
import mongoose from "mongoose";
import { ApiError } from "../../../utils/ApiError.js";
import {
  generateClassReportSheet,
  generateStudentReportCard,
  generateClassReportCardsBundle,
} from "./report-card.service.js";


export async function studentReportCardHandler(req, res) {
  const data = await generateStudentReportCard({
    user: req.user,
    studentId: req.params.studentId,
    sessionId: req.query.sessionId,
    termId: req.query.termId,
  });

  res.json({
    success: true,
    reportCard: data.reportCard, // ✅ IMPORTANT FIX
  });
}

export async function classReportSheetHandler(req, res) {
  const data = await generateClassReportSheet({
    user: req.user,
    classId: req.params.classId,
    sessionId: req.query.sessionId,
    termId: req.query.termId,
  });

  res.json({
    success: true,
    classReport: data.classReport, // ✅ IMPORTANT FIX
  });
}


export async function generateClassReportCardsBundleController(
  req,
  res
) {
  const { classId } = req.params;
  const { sessionId, termId } = req.query;

  /* =========================
     VALIDATION
  ========================= */

  if (
    !classId ||
    classId === "bundle" ||
    !mongoose.Types.ObjectId.isValid(classId)
  ) {
    throw new ApiError(
      400,
      "Invalid class ID"
    );
  }

  if (
    !sessionId ||
    !mongoose.Types.ObjectId.isValid(sessionId)
  ) {
    throw new ApiError(
      400,
      "Invalid session ID"
    );
  }

  if (
    !termId ||
    !mongoose.Types.ObjectId.isValid(termId)
  ) {
    throw new ApiError(
      400,
      "Invalid term ID"
    );
  }

  const data =
    await generateClassReportCardsBundle({
      user: req.user,
      classId,
      sessionId,
      termId,
    });

  res.status(200).json({
    success: true,
    ...data,
  });
}
