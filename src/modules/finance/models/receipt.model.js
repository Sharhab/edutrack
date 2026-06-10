import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    // =====================================
    // PAYMENT RELATION
    // =====================================
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },

    // =====================================
    // STUDENT
    // =====================================
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    // =====================================
    // STUDENT FEE
    // =====================================
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFee",
      required: true,
      index: true,
    },

    // =====================================
    // RECEIPT DETAILS
    // =====================================
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },

    reference: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    method: {
      type: String,
      enum: [
        "manual",
        "paystack",
        "bank",
        "cash",
        "bank_transfer",
        "pos",
      ],
      default: "cash",
    },

    status: {
      type: String,
      enum: [
        "success",
        "paid",
        "cancelled",
        "failed",
      ],
      default: "success",
    },

    // =====================================
    // FEE SNAPSHOT
    // =====================================
    title: {
      type: String,
      default: "",
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    balance: {
      type: Number,
      default: 0,
    },

    session: {
      type: String,
      default: "",
    },

    term: {
      type: String,
      default: "",
    },

    // =====================================
    // META
    // =====================================
    issuedAt: {
      type: Date,
      default: Date.now,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================
   INDEXES
========================================= */

receiptSchema.index({
  schoolId: 1,
  paymentId: 1,
});

receiptSchema.index({
  studentId: 1,
  studentFeeId: 1,
});

export const Receipt = mongoose.model(
  "Receipt",
  receiptSchema
);