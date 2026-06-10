import mongoose from "mongoose";

const installmentSchema =
  new mongoose.Schema(
    {
      schoolId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true,
      },

      studentFeeId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "StudentFee",
        required: true,
      },

      amount: {
        type: Number,
        required: true,
      },

      dueDate: {
        type: Date,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "paid",
          "overdue",
        ],
        default: "pending",
      },
    },
    {
      timestamps: true,
    }
  );

export const Installment =
  mongoose.model(
    "Installment",
    installmentSchema
  );