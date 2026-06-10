import mongoose from "mongoose";

const parentPortalSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
      index: true,
    },

    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    smsEnabled: {
      type: Boolean,
      default: false,
    },

    emailEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ParentPortal = mongoose.model(
  "ParentPortal",
  parentPortalSchema
);