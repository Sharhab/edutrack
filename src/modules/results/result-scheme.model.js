import mongoose from "mongoose";

const assessmentComponentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z][a-z0-9_]*$/,
    },

    label: {
      type: String,
      required: true,
      trim: true,
    },

    maxScore: {
      type: Number,
      required: true,
      min: 0.01,
      max: 100,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const resultSchemeSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    scope: {
      type: String,
      enum: ["school", "level", "class"],
      required: true,
    },

    scopeKey: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: String,
      default: "",
      trim: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },

    name: {
      type: String,
      default: "Standard Results Scheme",
      trim: true,
    },

    totalMax: {
      type: Number,
      default: 100,
      min: 1,
      max: 100,
    },

    components: {
      type: [assessmentComponentSchema],
      required: true,
      validate: {
        validator(components) {
          return (
            Array.isArray(components) &&
            components.length > 0
          );
        },
        message:
          "At least one assessment component is required.",
      },
    },

    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One scheme per school and scope key.
resultSchemeSchema.index(
  {
    schoolId: 1,
    scope: 1,
    scopeKey: 1,
  },
  {
    unique: true,
  }
);

export const ResultScheme = mongoose.model(
  "ResultScheme",
  resultSchemeSchema
);

export default ResultScheme;
