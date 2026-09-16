import mongoose from "mongoose";

import { ApiError } from "../../utils/apiError.js";

import {
  generateClassReportSheet,
  generateStudentReportCard,
  generateClassReportCardsBundle,
} from "./report-card.service.js";

/* =========================================================
   STUDENT REPORT CARD
========================================================= */

export async function studentReportCardHandler(req, res) {
  const data = await generateStudentReportCard({
    user: req.user,

    studentId: req.params.studentId,

    sessionId: req.query.sessionId,

    termId: req.query.termId,
  });

  res.json({
    success: true,

    reportCard: data.reportCard,
  });
}

/* =========================================================
   CLASS REPORT SHEET
========================================================= */

export async function classReportSheetHandler(req, res) {
  const data = await generateClassReportSheet({
    user: req.user,

    classId: req.params.classId,

    sessionId: req.query.sessionId,

    termId: req.query.termId,
  });

  res.json({
    success: true,

    classReport: data.classReport,
  });
}

/* =========================================================
   CLASS REPORT CARD BUNDLE
========================================================= */

export async function generateClassReportCardsBundleController(
  req,
  res
) {
  const { classId } = req.params;

  const { sessionId, termId } = req.query;

  /* =======================================================
     VALIDATE CLASS ID
  ======================================================= */

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

  /* =======================================================
     VALIDATE SESSION ID
  ======================================================= */

  if (
    !sessionId ||
    !mongoose.Types.ObjectId.isValid(sessionId)
  ) {
    throw new ApiError(
      400,
      "Invalid session ID"
    );
  }

  /* =======================================================
     VALIDATE TERM ID
  ======================================================= */

  if (
    !termId ||
    !mongoose.Types.ObjectId.isValid(termId)
  ) {
    throw new ApiError(
      400,
      "Invalid term ID"
    );
  }

  /* =======================================================
     GENERATE BUNDLE
  ======================================================= */

  const data =
    await generateClassReportCardsBundle({
      user: req.user,

      classId,

      sessionId,

      termId,
    });

  /* =======================================================
     NORMALIZE RESPONSE FOR FRONTEND
     
     FRONTEND EXPECTS:

     reports: [
       {
         reportCard: {
           student: {},
           session: {},
           term: {},
           results: [],
           summary: {},
           attendance: {}
         }
       }
     ]

     The service may return:

     reports: [
       {
         student: {},
         session: {},
         term: {},
         results: [],
         summary: {},
         attendance: {}
       }
     ]

     So we wrap every report here.
  ======================================================= */

  const normalizedReports = Array.isArray(data?.reports)
    ? data.reports.map((report) => {
        /*
         * If the service already returns:
         *
         * { reportCard: {...} }
         *
         * don't wrap it again.
         */
        if (
          report &&
          typeof report === "object" &&
          "reportCard" in report
        ) {
          return report;
        }

        /*
         * Otherwise wrap the StudentReportCard.
         */
        return {
          reportCard: report,
        };
      })
    : [];

  /* =======================================================
     FINAL RESPONSE
  ======================================================= */

  res.status(200).json({
    success: true,

    class: data?.class,

    sessionId: data?.sessionId || sessionId,

    termId: data?.termId || termId,

    totalStudents:
      data?.totalStudents ?? normalizedReports.length,

    generatedAt:
      data?.generatedAt || new Date(),

    reports: normalizedReports,
  });
}
