import mongoose from "mongoose";
import { GradingScale } from "./grading-scale.model.js";
import { ApiError } from "../../utils/apiError.js";

function validateBands(bands) {
  if (!Array.isArray(bands) || bands.length === 0) {
    throw new ApiError(
      400,
      "Add at least one grade band."
    );
  }

  const normalized = bands.map((band) => ({
    grade: String(band.grade ?? "").trim(),
    minScore: Number(band.minScore),
    maxScore: Number(band.maxScore),
    remark: String(band.remark ?? "").trim(),
  }));

  const labels = normalized.map((band) =>
    band.grade.toLowerCase()
  );

  if (new Set(labels).size !== labels.length) {
    throw new ApiError(
      400,
      "Each grade label must be unique."
    );
  }

  for (const band of normalized) {
    if (!band.grade || !band.remark) {
      throw new ApiError(
        400,
        "Every grade requires a label and remark."
      );
    }

    if (
      !Number.isFinite(band.minScore) ||
      !Number.isFinite(band.maxScore) ||
      band.minScore < 0 ||
      band.maxScore > 100 ||
      band.minScore >= band.maxScore
    ) {
      throw new ApiError(
        400,
        `Invalid score range for grade ${band.grade}.`
      );
    }
  }

  normalized.sort((a, b) => a.minScore - b.minScore);

  if (normalized[0].minScore !== 0) {
    throw new ApiError(
      400,
      "The grading scale must start at 0."
    );
  }

  if (normalized[normalized.length - 1].maxScore !== 100) {
    throw new ApiError(
      400,
      "The grading scale must end at 100."
    );
  }

  for (let index = 1; index < normalized.length; index++) {
    const previous = normalized[index - 1];
    const current = normalized[index];

    if (current.minScore < previous.maxScore) {
      throw new ApiError(
        400,
        `The score ranges for ${previous.grade} and ${current.grade} overlap.`
      );
    }

    if (current.minScore !== previous.maxScore) {
      throw new ApiError(
        400,
        `There is a gap between ${previous.grade} and ${current.grade}. The next minimum must equal the previous maximum.`
      );
    }
  }

  return normalized;
}

function getSchoolId(user) {
  if (!user?.schoolId || !mongoose.Types.ObjectId.isValid(user.schoolId)) {
    throw new ApiError(
      400,
      "A valid school context is required."
    );
  }

  return new mongoose.Types.ObjectId(user.schoolId);
}

export async function getSchoolGradingScale(user) {
  const schoolId = getSchoolId(user);

  const scale = await GradingScale.findOne({
    schoolId,
  }).lean();

  return {
    configured: Boolean(scale?.bands?.length),
    bands: scale?.bands || [],
    updatedAt: scale?.updatedAt || null,
  };
}

export async function saveSchoolGradingScale(user, bands) {
  const schoolId = getSchoolId(user);
  const validatedBands = validateBands(bands);

  const scale = await GradingScale.findOneAndUpdate(
    { schoolId },
    {
      $set: {
        schoolId,
        bands: validatedBands,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return {
    configured: true,
    bands: scale.bands,
    updatedAt: scale.updatedAt,
  };
}
