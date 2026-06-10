import mongoose from "mongoose";
import { tenantPlugin } from "../../plugins/tenant.plugin.js";

const studentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      index: true,
      required: true,
    },

    admissionNumber: {
      type: String,
      required: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    parentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
      },
    ],

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    enrollmentDate: {
      type: Date,
      default: Date.now,
    },

    photo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

/**
 * =========================
 * INDEXES (IMPORTANT)
 * =========================
 */
studentSchema.index(
  { schoolId: 1, admissionNumber: 1 },
  { unique: true }
);

studentSchema.index({ schoolId: 1, classId: 1 });
studentSchema.index({ schoolId: 1, parentIds: 1 });

/**
 * =========================
 * TENANT PLUGIN ENABLED
 * =========================
 */
studentSchema.plugin(tenantPlugin);

export const Student = mongoose.model("Student", studentSchema);