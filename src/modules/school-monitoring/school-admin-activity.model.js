
import mongoose from "mongoose";

const schoolAdminActivitySchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    module: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 500,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    entityType: {
      type: String,
      default: null,
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    performedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

schoolAdminActivitySchema.index({
  schoolId: 1,
  performedAt: -1,
});

schoolAdminActivitySchema.index({
  schoolId: 1,
  userId: 1,
  performedAt: -1,
});

schoolAdminActivitySchema.index({
  schoolId: 1,
  module: 1,
  performedAt: -1,
});

export const SchoolAdminActivity = mongoose.model(
  "SchoolAdminActivity",
  schoolAdminActivitySchema
);
