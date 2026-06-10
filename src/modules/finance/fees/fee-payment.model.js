import mongoose from "mongoose";

const feePaymentSchema = new mongoose.Schema(
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


studentFeeId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "StudentFee",
  required: true,
  index: true,
},

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "card", "online", "pos"],
      default: "cash",
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },

    reference: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "success",
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * INDEXES
 */
feePaymentSchema.index({ schoolId: 1, studentId: 1 });
feePaymentSchema.index({ schoolId: 1, invoiceId: 1 });

export const Payment = mongoose.model("Payment", feePaymentSchema);