
import {
  getResultScheme,
  saveResultScheme,
  listResultSchemes,
} from "./result-scheme.service.js";

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
export async function getResultSchemeController(req, res, next) {
  try {
    const user = getRequestUser(req);

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
