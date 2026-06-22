import mongoose from "mongoose";

import {
  createOrUpdateResult,
  listResults,
  getStudentResults,
  getAdminResultsOverview,
  generateClassResults,
  publishClassResults,
  lockClassResults,
  unlockClassResults,
} from "./result.service.js";
import {
  getAdminResultSummary,
} from "./result.service.js";
import { bulkUpsertResults } from "./bulk-upsert.js";

/* =========================================
   MISSING IMPORTS (IMPORTANT)
========================================= */


/* =========================================
   HELPERS
========================================= */

function isValidObjectId(id) {
  return (
    id &&
    mongoose.Types.ObjectId.isValid(id)
  );
}

function validateIds(
  fields = {}
) {
  const errors = {};

  for (const key in fields) {
    const value = fields[key];

    if (!value) {
      errors[key] =
        `${key} is required`;
      continue;
    }

    if (!isValidObjectId(value)) {
      errors[key] =
        `${key} is invalid`;
    }
  }

  return errors;
}

/* =========================================
   CREATE RESULT
========================================= */
export async function createResultHandler(
  req,
  res,
  next
) {
  try {
    const {
      studentId,
      subjectId,
      classId,
      sessionId,
      termId,
    } = req.body;

    const errors =
      validateIds({
        studentId,
        subjectId,
        classId,
        sessionId,
        termId,
      });

    if (
      Object.keys(errors).length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Validation failed",
        errors,
      });
    }

    const result =
      await createOrUpdateResult(
        req.body,
        req.user
      );

    res.json({
      success: true,
      message:
        "Result saved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   LIST RESULTS
========================================= */
export async function listResultsHandler(
  req,
  res,
  next
) {
  try {
    const {
      studentId,
      classId,
      sessionId,
      termId,
      subjectId,
    } = req.query;

    const idsToValidate = {};

    if (studentId)
      idsToValidate.studentId =
        studentId;

    if (classId)
      idsToValidate.classId =
        classId;

    if (sessionId)
      idsToValidate.sessionId =
        sessionId;

    if (termId)
      idsToValidate.termId =
        termId;

    if (subjectId)
      idsToValidate.subjectId =
        subjectId;

    const errors =
      validateIds(idsToValidate);

    if (
      Object.keys(errors).length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid query parameters",
        errors,
      });
    }

    const results =
      await listResults(
        req.query,
        req.user
      );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   STUDENT RESULTS
========================================= */
export async function getStudentResultsHandler(
  req,
  res,
  next
) {
  try {
    const { studentId } =
      req.params;

    if (
      !isValidObjectId(studentId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid studentId",
      });
    }

    const results =
      await getStudentResults(
        studentId,
        req.user
      );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   ADMIN RESULTS OVERVIEW
========================================= */
export async function getAdminResultsOverviewHandler(
  req,
  res,
  next
) {
  try {
    const {
      sessionId,
      termId,
    } = req.query;

    const errors =
      validateIds({
        sessionId,
        termId,
      });

    if (
      Object.keys(errors).length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Validation failed",
        errors,
      });
    }

    const data =
      await getAdminResultsOverview({
        schoolId:
          req.user.schoolId,

        sessionId,

        termId,
      });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   GENERATE CLASS RESULTS
========================================= */
export async function generateResultsHandler(
  req,
  res,
  next
) {
  try {
    const {
      sessionId,
      termId,
      classId,
    } = req.body;

    const errors =
      validateIds({
        sessionId,
        termId,
        classId,
      });

    if (
      Object.keys(errors).length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Validation failed",
        errors,
      });
    }

    const data =
      await generateClassResults({
        schoolId:
          req.user.schoolId,

        sessionId,

        termId,

        classId,
      });

    res.json({
      success: true,
      message:
        "Class results generated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   PUBLISH CLASS RESULTS
========================================= */
export async function publishResultsHandler(
  req,
  res,
  next
) {
  try {
    const {
      sessionId,
      termId,
      classId,
    } = req.body;

    const errors =
      validateIds({
        sessionId,
        termId,
        classId,
      });

    if (
      Object.keys(errors).length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Validation failed",
        errors,
      });
    }

    const data =
  await publishClassResults({
  schoolId: req.user.schoolId,
  classId,
  sessionId,
  termId,
});
    res.json({
      success: true,
      message:
        "Results published successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   LOCK CLASS RESULTS
========================================= */
export async function lockResultsHandler(
  req,
  res,
  next
) {
  try {
    const {
      sessionId,
      termId,
      classId,
    } = req.body;

    const errors =
      validateIds({
        sessionId,
        termId,
        classId,
      });

    if (
      Object.keys(errors).length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Validation failed",
        errors,
      });
    }

    const data =
      await lockClassResults({
        schoolId:
          req.user.schoolId,

        sessionId,

        termId,

        classId,
      });

    res.json({
      success: true,
      message:
        "Results locked successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

/* =========================================
   UNLOCK CLASS RESULTS
========================================= */
export async function unlockResultsHandler(
  req,
  res,
  next
) {
  try {
    const {
      sessionId,
      termId,
      classId,
    } = req.body;

    const errors =
      validateIds({
        sessionId,
        termId,
        classId,
      });

    if (
      Object.keys(errors).length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Validation failed",
        errors,
      });
    }

    const data =
      await unlockClassResults({
        schoolId:
          req.user.schoolId,
        sessionId,
        termId,
        classId,
      });

    res.json({
      success: true,
      message:
        "Results unlocked successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}


export async function bulkUpsertResultsHandler(req, res) {
  console.log("REQ USER:", req.user);

  const result = await bulkUpsertResults({
    schoolId: req.user.schoolId,
    ...req.body,
    user: req.user,
  });

  res.json(result);
}

export async function getTeacherResultContextHandler(req, res, next) {
  try {
    const teacher = await Teacher.findOne({
      userId: req.user._id,
      schoolId: req.user.schoolId,
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    const classes = await ClassModel.find({
      _id: { $in: teacher.classIds || [] },
      schoolId: req.user.schoolId,
    }).select("name level");

    const subjects = await SubjectModel.find({
      _id: { $in: teacher.subjectIds || [] }, // ✅ FIXED FIELD
      schoolId: req.user.schoolId,            // ✅ FIXED
      isActive: true,
    }).select("name code classIds");

    const sessions = await Session.find({
      schoolId: req.user.schoolId,
    }).sort({ createdAt: -1 });

    const terms = await Term.find({
      schoolId: req.user.schoolId,
    }).sort({ createdAt: -1 });

    const activeSession = sessions.find((s) => s.isActive) || sessions[0];
    const activeTerm = terms.find((t) => t.isActive) || terms[0];

    res.json({
      success: true,
      data: {
        classes,
        subjects,
        sessions,
        terms,
        session: activeSession,
        term: activeTerm,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminResultSummaryHandler(
  req,
  res
) {
  const data =
    await getAdminResultSummary({
      schoolId: req.user.schoolId,

      sessionId: req.query.sessionId,

      termId: req.query.termId,
    });

  res.json({
    success: true,
    message:
      "Result summary fetched successfully",
    data,
  });
}