
import { ApiError } from "../../utils/apiError.js";

import {
  getClassTraitAssessments,
  saveStudentTraitAssessment,
} from "./trait-assessment.service.js";

import {
  traitAssessmentParamsSchema,
  traitAssessmentStudentParamsSchema,
  traitAssessmentQuerySchema,
  saveTraitAssessmentSchema,
} from "./trait-assessment.validation.js";

function getSchoolId(req) {
  const schoolId = req.user?.schoolId;

  if (!schoolId) {
    throw new ApiError(403, "School context is required");
  }

  return schoolId;
}

function validate(schema, value) {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ApiError(
      400,
      result.error.issues
        .map((issue) => {
          const field = issue.path.join(".");
          return field
            ? `${field}: ${issue.message}`
            : issue.message;
        })
        .join("; ")
    );
  }

  return result.data;
}

export async function getClassTraitAssessmentsHandler(
  req,
  res,
  next
) {
  try {
    const { classId } = validate(
      traitAssessmentParamsSchema,
      req.params
    );

    const { sessionId, termId } = validate(
      traitAssessmentQuerySchema,
      req.query
    );

    const data = await getClassTraitAssessments({
      user: req.user,
      schoolId: getSchoolId(req),
      classId,
      sessionId,
      termId,
    });

    return res.status(200).json({
      success: true,
      message: "Class trait assessments fetched successfully",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

export async function saveStudentTraitAssessmentHandler(
  req,
  res,
  next
) {
  try {
    const { studentId } = validate(
      traitAssessmentStudentParamsSchema,
      req.params
    );

    const payload = validate(
      saveTraitAssessmentSchema,
      req.body
    );

    const data = await saveStudentTraitAssessment({
      user: req.user,
      schoolId: getSchoolId(req),
      studentId,
      payload,
    });

    return res.status(200).json({
      success: true,
      message: "Student trait assessment saved successfully",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

