import mongoose from "mongoose";

const feeItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    optional: { type: Boolean, default: false },
  },
  { _id: false }
);

const feeStructureSchema = new mongoose.Schema(
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
    },

    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    title: { type: String, required: true, trim: true },

    items: { type: [feeItemSchema], default: [] },

    totalAmount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

feeStructureSchema.index(
  { schoolId: 1, sessionId: 1, termId: 1, classId: 1 },
  { unique: true }
);

// ✅ IMPORTANT FIX (NAMED EXPORT)
export const FeeStructure = mongoose.model(
  "FeeStructure",
  feeStructureSchema
);