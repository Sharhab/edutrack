
import { ApiError } from "../../utils/apiError.js";
import { computeGrade } from "./grade.utils.js";

/**
 * Legacy assessment scheme.
 * Used for existing schools or results that do not yet have
 * a configured dynamic result scheme.
 */
export const LEGACY_ASSESSMENT_COMPONENTS = [
  { key: "ca1", label: "CA 1", maxScore: 10 },
  { key: "ca2", label: "CA 2", maxScore: 10 },
  { key: "assignment", label: "Assignment", maxScore: 10 },
  { key: "exam", label: "Examination", maxScore: 70 },
];

/**
 * Return a normalized scheme.
 * If no scheme is configured, retain the existing 10+10+10+70 system.
 */
export function normalizeAssessmentScheme(scheme) {
  const components =
    Array.isArray(scheme?.components) && scheme.components.length > 0
      ? scheme.components
      : LEGACY_ASSESSMENT_COMPONENTS;

  const normalizedComponents = components.map((component) => ({
    key: String(component.key || "").trim(),
    label: String(component.label || component.key || "").trim(),
    maxScore: Number(component.maxScore),
  }));

  const keys = normalizedComponents.map((component) => component.key);

  if (
    normalizedComponents.some(
      (component) =>
        !component.key ||
        !Number.isFinite(component.maxScore) ||
        component.maxScore <= 0 ||
        component.maxScore > 100
    )
  ) {
    throw new ApiError(400, "The assessment scheme contains invalid components.");
  }

  if (new Set(keys).size !== keys.length) {
    throw new ApiError(400, "Assessment component keys must be unique.");
  }

  const totalMax = normalizedComponents.reduce(
    (sum, component) => sum + component.maxScore,
    0
  );

  if (Math.abs(totalMax - 100) > 0.001) {
    throw new ApiError(
      400,
      "The maximum scores for all assessment components must total 100."
    );
  }

  return {
    version: Number(scheme?.version) || 1,
    totalMax: 100,
    components: normalizedComponents,
  };
}

/**
 * Calculate one result using the selected assessment scheme.
 *
 * scores example:
 * {
 *   assignment: 8,
 *   ca1: 7,
 *   ca2: 9,
 *   exam: 60
 * }
 *
 * Blank or missing scores remain null; they are not silently
 * treated as zero during calculation.
 */
export function calculateDynamicResultFields({
  scores = {},
  scheme,
  gradeBands = [],
}) {
  const normalizedScheme = normalizeAssessmentScheme(scheme);

  const normalizedScores = {};
  let total = 0;
  let hasAnyScore = false;

  for (const component of normalizedScheme.components) {
    const rawValue = scores?.[component.key];

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      normalizedScores[component.key] = null;
      continue;
    }

    const score = Number(rawValue);

    if (!Number.isFinite(score) || score < 0) {
      throw new ApiError(
        400,
        `Invalid score for ${component.label}. Enter a number from 0 to ${component.maxScore}.`
      );
    }

    if (score > component.maxScore) {
      throw new ApiError(
        400,
        `${component.label} cannot exceed ${component.maxScore}.`
      );
    }

    normalizedScores[component.key] = score;
    total += score;
    hasAnyScore = true;
  }

  // Reject unknown score keys to catch frontend/backend mismatches.
  const allowedKeys = new Set(
    normalizedScheme.components.map((component) => component.key)
  );

  for (const key of Object.keys(scores || {})) {
    if (!allowedKeys.has(key)) {
      throw new ApiError(
        400,
        `Unknown assessment component: ${key}.`
      );
    }
  }

  const finalTotal = hasAnyScore ? total : null;

  const gradeResult =
    finalTotal === null
      ? { grade: "", remark: "" }
      : computeGrade(finalTotal, gradeBands);

  // Keep legacy fields populated when their matching component exists.
  const legacyFields = {};

  for (const key of ["ca1", "ca2", "assignment", "exam"]) {
    legacyFields[key] =
      Object.prototype.hasOwnProperty.call(normalizedScores, key)
        ? normalizedScores[key]
        : undefined;
  }

  return {
    scores: normalizedScores,
    total: finalTotal,
    grade: gradeResult.grade ?? "",
    remark: gradeResult.remark ?? "",
    ...legacyFields,
    assessmentScheme: normalizedScheme,
  };
}
