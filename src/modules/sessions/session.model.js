import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * =========================
     * SESSION DATES
     * =========================
     */
    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    /**
     * =========================
     * ACTIVE SESSION
     * =========================
     */
    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * =========================
 * UNIQUE SESSION
 * =========================
 */
sessionSchema.index(
  {
    schoolId: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

export const Session =
  mongoose.models.Session ||
  mongoose.model(
    "Session",
    sessionSchema
  );