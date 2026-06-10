import mongoose from "mongoose";

/* =========================================
   STUDENT FEE ACCOUNT (CLEAN VERSION)
========================================= */
const studentFeeSchema = new mongoose.Schema(
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

    sessionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Session",
},

termId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Term",
},

session: String,
term: String,

    // 🔥 Linked to Fee Plan (NOT FeeStructure anymore)
   feePlanId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "FeeStructure", // ✅ correct
  required: true,
  index: true,
},

    title: {
      type: String,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },

    type: {
      type: String,
      enum: ["debit", "credit"],
      default: "debit",
    },

    description: {
      type: String,
      default: "",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    isFeePlan: {
      type: Boolean,
      default: false,
    },

    isClassAssignment: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================
   INDEXES
========================================= */
studentFeeSchema.index(
  {
    schoolId: 1,
    studentId: 1,
    feePlanId: 1,
  },
  {
    unique: true,
  }

);

export const StudentFee = mongoose.model(
  "StudentFee",
  studentFeeSchema
);