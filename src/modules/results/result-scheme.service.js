import mongoose from "mongoose";

import { ResultScheme } from "./result-scheme.model.js";
import { ClassModel } from "../classes/class.model.js";
import { ApiError } from "../../utils/apiError.js";

const DEFAULT_COMPONENTS = [
  {
    key: "assignment",
    label: "Assignment",
    maxScore: 10,
    enabled: true,
    order: 0,
  },
  {
    key: "ca1",
    label: "1st CA",
    maxScore: 10,
    enabled: true,
    order: 1,
  },
  {
    key: "ca2",
    label: "2nd CA",
    maxScore: 10,
    enabled: true,
    order: 2,
  },
  {
    key: "exam",
    label: "Exam",
    maxScore: 70,
    enabled: true,
    order: 3,
  },
];

function getSchoolId(user) {
  if (
    !user?.schoolId ||
    !mongoose.Types.ObjectId.isValid(user.schoolId)
  ) {
    throw new ApiError(
      400,
      "A valid school context is required."
    );
  }

  return new mongoose.Types.ObjectId(user.schoolId);
}

function validateScheme(input) {
  const name = String(
    input?.name ?? "Results Scheme"
  ).trim();

  const totalMax = Number(
    input?.totalMax ?? 100
  );

  const rawComponents = input?.components;

  if (!name) {
    throw new ApiError(
      400,
      "Scheme name is required."
    );
  }

  if (
    !Number.isFinite(totalMax) ||
    totalMax !== 100
  ) {
    throw new ApiError(
      400,
      "Assessment components must total 100 marks."
    );
  }

  if (
    !Array.isArray(rawComponents) ||
    rawComponents.length < 1 ||
    rawComponents.length > 12
  ) {
    throw new ApiError(
      400,
      "Add between 1 and 12 assessment components."
    );
  }

  const seenKeys = new Set();

  const components = rawComponents.map(
    (item, index) => {
      const key = String(
        item?.key ?? ""
      )
        .trim()
        .toLowerCase();

      const label = String(
        item?.label ?? ""
      ).trim();

      const maxScore = Number(
        item?.maxScore
      );

      if (
        !/^[a-z][a-z0-9_]*$/.test(key)
      ) {
        throw new ApiError(
          400,
          "Each assessment needs a valid key."
        );
      }

      if (seenKeys.has(key)) {
        throw new ApiError(
          400,
          `Duplicate assessment key: ${key}.`
        );
      }

      seenKeys.add(key);

      if (!label) {
        throw new ApiError(
          400,
          "Every assessment needs a label."
        );
      }

      if (
        !Number.isFinite(maxScore) ||
        maxScore <= 0 ||
        maxScore > 100
      ) {
        throw new ApiError(
          400,
          `Invalid maximum score for ${label}.`
        );
      }

      return {
        key,
        label,
        maxScore,
        enabled: item?.enabled !== false,
        order: Number.isFinite(
          Number(item?.order)
        )
          ? Number(item.order)
          : index,
      };
    }
  ).sort((a, b) => a.order - b.order);

  const enabledComponents = components.filter(
    (component) => component.enabled
  );

  if (!enabledComponents.length) {
    throw new ApiError(
      400,
      "Enable at least one assessment component."
    );
  }

  const calculatedTotal = enabledComponents.reduce(
    (sum, component) =>
      sum + component.maxScore,
    0
  );

  if (
    Math.abs(calculatedTotal - totalMax) > 0.001
  ) {
    throw new ApiError(
      400,
      `Enabled assessment maximums must add up to ${totalMax}. Current total: ${Number(calculatedTotal.toFixed(2))}.`
    );
  }

  return {
    name,
    totalMax,
    components,
  };
}

function formatScheme(scheme, source) {
  if (!scheme) return null;

  return {
    _id: scheme._id,
    name: scheme.name,
    scope: scheme.scope,
    scopeKey: scheme.scopeKey,
    level: scheme.level || "",
    classId: scheme.classId || null,
    totalMax: scheme.totalMax,
    components: scheme.components,
    version: scheme.version,
    updatedAt: scheme.updatedAt,
    source: source || scheme.scope,
  };
}

export async function getResultScheme(
  user,
  { classId, level } = {}
) {
  const schoolId = getSchoolId(user);

  // Priority 1: class-specific scheme.
  if (classId) {
    if (
      !mongoose.Types.ObjectId.isValid(classId)
    ) {
      throw new ApiError(
        400,
        "Invalid class ID."
      );
    }

    const classDoc = await ClassModel.findOne({
      _id: classId,
      schoolId,
    }).lean();

    if (!classDoc) {
      throw new ApiError(
        404,
        "Class not found in this school."
      );
    }

    const classScheme =
      await ResultScheme.findOne({
        schoolId,
        scope: "class",
        scopeKey: String(classDoc._id),
      }).lean();

    if (classScheme) {
      return {
        scheme: formatScheme(
          classScheme,
          "class"
        ),
        inherited: false,
      };
    }

    // Priority 2: academic-level scheme.
    const classLevel = String(
      classDoc.level || ""
    ).trim();

    if (classLevel) {
      const levelScheme =
        await ResultScheme.findOne({
          schoolId,
          scope: "level",
          scopeKey: classLevel.toLowerCase(),
        }).lean();

      if (levelScheme) {
        return {
          scheme: formatScheme(
            levelScheme,
            "level"
          ),
          inherited: true,
        };
      }
    }

    // Priority 3: school default.
    const schoolScheme =
      await ResultScheme.findOne({
        schoolId,
        scope: "school",
        scopeKey: "school",
      }).lean();

    return {
      scheme: formatScheme(
        schoolScheme,
        "school"
      ),
      inherited: true,
    };
  }

  if (level) {
    const levelKey = String(level)
      .trim()
      .toLowerCase();

    if (!levelKey) {
      throw new ApiError(
        400,
        "Level cannot be blank."
      );
    }

    const levelScheme =
      await ResultScheme.findOne({
        schoolId,
        scope: "level",
        scopeKey: levelKey,
      }).lean();

    if (levelScheme) {
      return {
        scheme: formatScheme(
          levelScheme,
          "level"
        ),
        inherited: false,
      };
    }
  }

  const schoolScheme =
    await ResultScheme.findOne({
      schoolId,
      scope: "school",
      scopeKey: "school",
    }).lean();

  return {
    scheme: formatScheme(
      schoolScheme,
      "school"
    ),
    inherited: false,
  };
}

export async function saveResultScheme(
  user,
  input
) {
  const schoolId = getSchoolId(user);
  const scope = input?.scope;

  if (
    !["school", "level", "class"].includes(scope)
  ) {
    throw new ApiError(
      400,
      "Scheme scope must be school, level, or class."
    );
  }

  let scopeKey = "school";
  let level = "";
  let classId = null;

  if (scope === "level") {
    level = String(
      input?.level ?? ""
    ).trim();

    if (!level) {
      throw new ApiError(
        400,
        "Choose an academic level for this scheme."
      );
    }

    scopeKey = level.toLowerCase();
  }

  if (scope === "class") {
    if (
      !input?.classId ||
      !mongoose.Types.ObjectId.isValid(
        input.classId
      )
    ) {
      throw new ApiError(
        400,
        "A valid class is required."
      );
    }

    const classDoc = await ClassModel.findOne({
      _id: input.classId,
      schoolId,
    }).lean();

    if (!classDoc) {
      throw new ApiError(
        404,
        "Class not found in this school."
      );
    }

    classId = classDoc._id;
    scopeKey = String(classDoc._id);
    level = classDoc.level || "";
  }

  const validated = validateScheme(input);

  const existing = await ResultScheme.findOne({
    schoolId,
    scope,
    scopeKey,
  }).lean();

  const update = {
    $set: {
      schoolId,
      scope,
      scopeKey,
      level,
      classId,
      ...validated,
      updatedBy: user._id || user.id || null,
    },
    $setOnInsert: {
      version: 1,
    },
  };

  if (existing) {
    update.$inc = { version: 1 };
  }

  const scheme = await ResultScheme.findOneAndUpdate(
    {
      schoolId,
      scope,
      scopeKey,
    },
    update,
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return formatScheme(scheme, scope);
}

export async function listResultSchemes(user) {
  const schoolId = getSchoolId(user);

  const schemes = await ResultScheme.find({
    schoolId,
  })
    .sort({ scope: 1, scopeKey: 1 })
    .lean();

  return schemes.map((scheme) =>
    formatScheme(scheme)
  );
}

export { DEFAULT_COMPONENTS };
