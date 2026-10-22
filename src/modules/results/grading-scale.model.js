import mongoose from "mongoose";

const gradeBandSchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      required: true,
      trim: true,
    },

    minScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    maxScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    remark: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const gradingScaleSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      unique: true,
      index: true,
    },

    bands: {
      type: [gradeBandSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const GradingScale = mongoose.model(
  "GradingScale",
  gradingScaleSchema
);
