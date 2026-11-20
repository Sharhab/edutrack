
import { ApiError } from "../../utils/apiError.js";
import { getResultScheme } from "../results/result-scheme.service.js";

/**
 * Resolve and validate the assessment component assigned to a CBT exam.
 *
 * The scheme lookup is class-aware, so it respects:
 * 1. Class-specific scheme
 * 2. Academic-level scheme
 * 3. School default scheme
 */
export async function getExamAssessmentComponent({
  user,
  classId,
  assessmentKey,
}) {
  if (!classId) {
    throw new ApiError(
      400,
      "A class is required to validate the assessment component."
    );
  }

  const key = String(assessmentKey || "")
    .trim()
    .toLowerCase();

  if (!key) {
    throw new ApiError(
      400,
      "Select the assessment component for this CBT exam."
    );
  }

  if (!/^[a-z][a-z0-9_]*$/.test(key)) {
    throw new ApiError(
      400,
      "Invalid assessment component key."
    );
  }

  const result = await getResultScheme(user, {
    classId: String(classId),
  });

  if (!result?.scheme) {
    throw new ApiError(
      400,
      "Configure an assessment scheme for this class before creating a CBT exam."
    );
  }

  const component = (result.scheme.components || []).find(
    (item) =>
      item.enabled === true &&
      String(item.key).toLowerCase() === key
  );

  if (!component) {
    throw new ApiError(
      400,
      "The selected assessment component is not enabled in this class's assessment scheme."
    );
  }

  return {
    key: component.key,
    label: component.label,
    maxScore: component.maxScore,
    aggregationMethod:
      component.aggregationMethod || "average",
    schemeVersion: result.scheme.version,
    schemeScope: result.scheme.scope,
    inherited: result.inherited,
  };
}
