import mongoose from "mongoose";

const ledgerSchema =
  new mongoose.Schema(
    {
      schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true,
        index: true,
      },

      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: [
          "invoice",
          "payment",
          "adjustment",
        ],
        required: true,
      },

      amount: {
        type: Number,
        required: true,
      },

      balanceAfter: {
        type: Number,
        required: true,
      },

      reference: {
        type: String,
        default: "",
      },

      description: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

ledgerSchema.index({
  schoolId: 1,
  studentId: 1,
});

export const Ledger =
  mongoose.model(
    "Ledger",
    ledgerSchema
  );