import mongoose from "mongoose";

const termSchema = new mongoose.Schema(
  {
    /**
     * =========================
     * SCHOOL
     * =========================
     */
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    /**
     * =========================
     * SESSION
     * =========================
     */
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    /**
     * =========================
     * TERM NAME
     * =========================
     */
    name: {
      type: String,
      enum: [
        "First Term",
        "Second Term",
        "Third Term",
      ],
      required: true,
      trim: true,
    },

    /**
     * =========================
     * TERM DATES
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
     * ACTIVE TERM
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
 * UNIQUE TERM
 * =========================
 */
termSchema.index(
  {
    schoolId: 1,
    sessionId: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

/**
 * =========================
 * EXPORT
 * =========================
 */
export const Term =
  mongoose.models.Term ||
  mongoose.model(
    "Term",
    termSchema
  );