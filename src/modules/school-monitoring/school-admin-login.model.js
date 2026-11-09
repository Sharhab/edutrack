
import mongoose from "mongoose";

const schoolAdminLoginSchema = new mongoose.Schema(
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

    loggedInAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Efficient school-specific login history queries.
schoolAdminLoginSchema.index({
  schoolId: 1,
  loggedInAt: -1,
});

schoolAdminLoginSchema.index({
  schoolId: 1,
  userId: 1,
  loggedInAt: -1,
});

export const SchoolAdminLogin = mongoose.model(
  "SchoolAdminLogin",
  schoolAdminLoginSchema
);
