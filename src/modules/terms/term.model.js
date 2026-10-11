import mongoose from "mongoose";

const termSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

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

termSchema.index({
  schoolId: 1,
  sessionId: 1,
  order: 1,
});

export const Term =
  mongoose.models.Term ||
  mongoose.model("Term", termSchema);
