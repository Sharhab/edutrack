import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    schoolId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "School",
  required: function () {
    return this.role !== "super_admin";
  },
},

    firstName: String,
    lastName: String,

    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["school_admin", "teacher", "student", "parent", "super_admin"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: Date,
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);