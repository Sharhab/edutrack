
import {
  getResultScheme,
  saveResultScheme,
  listResultSchemes,
} from "./result-scheme.service.js";
import { Teacher } from "../teachers/teacher.model.js";
import { ApiError } from "../../utils/apiError.js";

function getRequestUser(req) {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Authentication required.");
  }

  return user;
}

/**
 * GET /api/result-scheme
 * Query options:
 *   ?classId=<classId>
 *   ?level=<level>
 */


// Replace the existing getResultSchemeController with this.
export async function getResultSchemeController(req, res, next) {
  try {
    const user = getRequestUser(req);

    // Administrators may read schemes using the existing behavior.
    if (user.role !== "school_admin") {
      if (user.role !== "teacher") {
        throw new ApiError(403, "You are not allowed to view assessment schemes.");
      }

      const { classId } = req.query;

      if (!classId) {
        throw new ApiError(
          400,
          "A classId is required to view an assessment scheme."
        );
      }

      const teacher = await Teacher.findOne({
        userId: user._id,
        schoolId: user.schoolId,
        isActive: true,
        status: "active",
      }).select("classIds assignments");

      if (!teacher) {
        throw new ApiError(403, "Teacher profile not found or inactive.");
      }

      const assignedThroughClasses = (teacher.classIds || []).some(
        (id) => String(id) === String(classId)
      );

      const assignedThroughSubjects = (teacher.assignments || []).some(
        (assignment) =>
          String(assignment.classId) === String(classId)
      );

      if (!assignedThroughClasses && !assignedThroughSubjects) {
        throw new ApiError(
          403,
          "You are not assigned to this class."
        );
      }
    }

    const result = await getResultScheme(user, {
      classId: req.query.classId,
      level: req.query.level,
    });

    return res.status(200).json({
      success: true,
      message: result.scheme
        ? "Result scheme fetched successfully."
        : "No result scheme configured yet.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/result-scheme/all
 */
export async function listResultSchemesController(req, res, next) {
  try {
    const user = getRequestUser(req);
    const schemes = await listResultSchemes(user);

    return res.status(200).json({
      success: true,
      message: "Result schemes fetched successfully.",
      data: schemes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/result-scheme
 */
export async function saveResultSchemeController(req, res, next) {
  try {
    const user = getRequestUser(req);
    const scheme = await saveResultScheme(user, req.body);

    return res.status(200).json({
      success: true,
      message: "Result scheme saved successfully.",
      data: scheme,
    });
  } catch (error) {
    next(error);
  }
}
