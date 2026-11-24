
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: function () {
        return this.role !== "super_admin";
      },
      index: true,
    },

    firstName: String,
    lastName: String,

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: undefined,
      sparse: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    // Set true when an administrator issues initial credentials
    // or resets a temporary password.
    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: [
        "school_admin",
        "teacher",
        "student",
        "parent",
        "super_admin",
      ],
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
