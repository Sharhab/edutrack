
import mongoose from "mongoose";

import {
  initializePaystackPayment,
  verifyPaystackPayment,
} from "../payments/paystack.service.js";

import { Invoice } from "../models/invoice.model.js";
import { Payment } from "./fee-payment.model.js";
import { Receipt } from "../models/receipt.model.js";
import { StudentFee } from "./studentFee.model.js";
import { Ledger } from "../models/ledger.model.js";
import { FeeStructure } from "../models/feeStructure.model.js";
import { ApiError } from "../../../utils/apiError.js";

/* =========================================
   VALIDATION HELPERS
========================================= */

function validateObjectId(id, field) {
  if (!id) {
    throw new ApiError(400, `${field} is required`);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
}

function normalizeSchoolId(user) {
  if (!user?.schoolId) {
    throw new ApiError(400, "Invalid school context");
  }

  return new mongoose.Types.ObjectId(user.schoolId);
}

function paymentStatus(amountPaid, totalAmount) {
  if (amountPaid >= totalAmount) return "paid";
  if (amountPaid > 0) return "partial";
  return "unpaid";
}

function createInvoiceNumber() {
  return `INV-${new mongoose.Types.ObjectId().toString().toUpperCase()}`;
}

function createReceiptNumber() {
  return `RCT-${new mongoose.Types.ObjectId().toString().toUpperCase()}`;
}

function getPaymentMethod(method) {
  const allowed = [
    "cash",
    "bank_transfer",
    "card",
    "online",
    "pos",
  ];

  return allowed.includes(method) ? method : "cash";
}

async function findInvoiceForFee({
  schoolId,
  studentId,
  studentFee,
  session,
}) {
  const query = {
    schoolId,
    studentId,
    feeStructureId: studentFee.feePlanId,
  };

  if (studentFee.sessionId) {
    query.sessionId = studentFee.sessionId;
  }

  if (studentFee.termId) {
    query.termId = studentFee.termId;
  }

  let invoiceQuery = Invoice.findOne(query);

  if (session) {
    invoiceQuery = invoiceQuery.session(session);
  }

  return invoiceQuery;
}

async function syncInvoiceFromStudentFee({
  invoice,
  studentFee,
  session,
}) {
  if (!invoice) return null;

  invoice.amount = studentFee.totalAmount;
  invoice.totalAmount = studentFee.totalAmount;
  invoice.amountPaid = studentFee.amountPaid;
  invoice.balanceAmount = studentFee.balance;
  invoice.paymentStatus = studentFee.status;
  invoice.status = studentFee.status;

  await invoice.save(session ? { session } : undefined);

  return invoice;
}

/* =========================================
   CREATE FEE PLAN
========================================= */
export async function createFeePlan({
  schoolId,
  title,
  amount,
  classId,
  sessionId,
  termId,
  description,
  paymentPolicy = {},
}) {
  if (!title?.trim()) {
    throw new ApiError(400, "Fee title is required");
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Valid amount required");
  }

  validateObjectId(classId, "classId");
  validateObjectId(sessionId, "sessionId");
  validateObjectId(termId, "termId");

  const allowedModes = [
    "full_only",
    "flexible_partial",
    "fixed_installment",
  ];

  const mode = paymentPolicy.mode || "full_only";
  const minimumPaymentAmount =
    paymentPolicy.minimumPaymentAmount == null
      ? null
      : Number(paymentPolicy.minimumPaymentAmount);
  const installmentAmount =
    paymentPolicy.installmentAmount == null
      ? null
      : Number(paymentPolicy.installmentAmount);

  if (!allowedModes.includes(mode)) {
    throw new ApiError(400, "Invalid payment policy");
  }

  if (
    mode === "flexible_partial" &&
    minimumPaymentAmount != null &&
    (!Number.isFinite(minimumPaymentAmount) ||
      minimumPaymentAmount <= 0 ||
      minimumPaymentAmount > numericAmount)
  ) {
    throw new ApiError(
      400,
      "Minimum payment must be greater than zero and cannot exceed the total fee"
    );
  }

  if (
    mode === "fixed_installment" &&
    (!Number.isFinite(installmentAmount) ||
      installmentAmount <= 0 ||
      installmentAmount > numericAmount)
  ) {
    throw new ApiError(
      400,
      "Installment amount must be greater than zero and cannot exceed the total fee"
    );
  }

  const ClassModel = mongoose.model("Class");
  const SessionModel = mongoose.model("Session");
  const TermModel = mongoose.model("Term");

  
const [classExists, sessionExists, termExists] =
  await Promise.all([
    ClassModel.findOne({
      _id: classId,
      schoolId,
    }),

    SessionModel.findOne({
      _id: sessionId,
      schoolId,
    }),

    // The term must belong to the selected session.
    TermModel.findOne({
      _id: termId,
      schoolId,
      sessionId,
    }),
  ]);

if (!classExists) {
  throw new ApiError(404, "Class not found");
}

if (!sessionExists) {
  throw new ApiError(404, "Session not found");
}

if (!termExists) {
  throw new ApiError(
    400,
    "Term not found or does not belong to the selected session"
  );
}

  return FeeStructure.create({
    schoolId,
    title: title.trim(),
    classId,
    sessionId,
    termId,
    totalAmount: numericAmount,
    items: [
      {
        title: title.trim(),
        amount: numericAmount,
        optional: false,
      },
    ],
    description: description || "",
    paymentPolicy: {
      mode,
      minimumPaymentAmount:
        mode === "flexible_partial"
          ? minimumPaymentAmount
          : null,
      installmentAmount:
        mode === "fixed_installment"
          ? installmentAmount
          : null,
    },
    isActive: true,
  });
}


/* =========================================
   LIST FEE PLANS
========================================= */

export async function getFeePlans(schoolId) {
  return FeeStructure.find({
    schoolId,
    isActive: true,
  })
    .populate("classId", "name")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .sort({ createdAt: -1 });
}


/* =========================================
   UPDATE FEE PLAN
   Existing student balances and payments
   are intentionally left unchanged.
========================================= */

export async function updateFeePlan({
  schoolId,
  feePlanId,
  payload = {},
}) {
  validateObjectId(feePlanId, "feePlanId");

  const feePlan = await FeeStructure.findOne({
    _id: feePlanId,
    schoolId,
    isActive: true,
  });

  if (!feePlan) {
    throw new ApiError(404, "Active fee plan not found");
  }

  const allowedFields = [
    "title",
    "amount",
    "description",
    "paymentPolicy",
  ];

  const suppliedFields = Object.keys(payload);

  if (
    suppliedFields.length === 0 ||
    suppliedFields.some((field) => !allowedFields.includes(field))
  ) {
    throw new ApiError(
      400,
      "Only title, amount, description and paymentPolicy can be updated"
    );
  }

  const title =
    payload.title === undefined
      ? feePlan.title
      : String(payload.title).trim();

  const amount =
    payload.amount === undefined
      ? Number(feePlan.totalAmount)
      : Number(payload.amount);

  const description =
    payload.description === undefined
      ? feePlan.description
      : String(payload.description ?? "").trim();

  if (!title) {
    throw new ApiError(400, "Fee title is required");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, "Valid amount required");
  }

  const currentPolicy = feePlan.paymentPolicy?.toObject
    ? feePlan.paymentPolicy.toObject()
    : feePlan.paymentPolicy || {};

  const incomingPolicy = payload.paymentPolicy;

  if (
    incomingPolicy !== undefined &&
    (
      !incomingPolicy ||
      typeof incomingPolicy !== "object" ||
      Array.isArray(incomingPolicy)
    )
  ) {
    throw new ApiError(400, "Invalid payment policy");
  }

  const policy = {
    ...currentPolicy,
    ...(incomingPolicy || {}),
  };

  const allowedModes = [
    "full_only",
    "flexible_partial",
    "fixed_installment",
  ];

  const mode = policy.mode || "full_only";

  if (!allowedModes.includes(mode)) {
    throw new ApiError(400, "Invalid payment policy");
  }

  const minimumPaymentAmount =
    policy.minimumPaymentAmount == null
      ? null
      : Number(policy.minimumPaymentAmount);

  const installmentAmount =
    policy.installmentAmount == null
      ? null
      : Number(policy.installmentAmount);

  if (
    mode === "flexible_partial" &&
    minimumPaymentAmount !== null &&
    (
      !Number.isFinite(minimumPaymentAmount) ||
      minimumPaymentAmount <= 0 ||
      minimumPaymentAmount > amount
    )
  ) {
    throw new ApiError(
      400,
      "Minimum payment must be greater than zero and cannot exceed the total fee"
    );
  }

  if (
    mode === "fixed_installment" &&
    (
      !Number.isFinite(installmentAmount) ||
      installmentAmount <= 0 ||
      installmentAmount > amount
    )
  ) {
    throw new ApiError(
      400,
      "Installment amount must be greater than zero and cannot exceed the total fee"
    );
  }

  feePlan.title = title;
  feePlan.totalAmount = amount;
  feePlan.description = description;

  feePlan.items = [
    {
      title,
      amount,
      optional: false,
    },
  ];

  feePlan.paymentPolicy = {
    mode,
    minimumPaymentAmount:
      mode === "flexible_partial"
        ? minimumPaymentAmount
        : null,
    installmentAmount:
      mode === "fixed_installment"
        ? installmentAmount
        : null,
  };

  await feePlan.save();

  return feePlan;
}


/* =========================================
   ASSIGN FEE TO ONE STUDENT
========================================= */

export async function assignFeeToStudent({
  schoolId,
  studentId,
  feePlanId,
}) {
  validateObjectId(studentId, "studentId");
  validateObjectId(feePlanId, "feePlanId");

  const feePlan = await FeeStructure.findOne({
    _id: feePlanId,
    schoolId,
    isActive: true,
  })
    .populate("sessionId", "name")
    .populate("termId", "name");

 
if (!feePlan) {
  throw new ApiError(404, "Active fee plan not found");
}

const planSessionId = String(
  feePlan.sessionId?._id || feePlan.sessionId || ""
);

const planTermId = String(
  feePlan.termId?._id || feePlan.termId || ""
);

if (!planSessionId || !planTermId) {
  throw new ApiError(
    409,
    "Fee plan is missing its academic session or term"
  );
}

const [validSession, validTerm] = await Promise.all([
  mongoose.model("Session").findOne({
    _id: planSessionId,
    schoolId,
  }),

  mongoose.model("Term").findOne({
    _id: planTermId,
    schoolId,
    sessionId: planSessionId,
  }),
]);

if (!validSession || !validTerm) {
  throw new ApiError(
    409,
    "Fee plan has an invalid session or a term that does not belong to that session"
  );
}


  const student = await mongoose.model("Student").findOne({
    _id: studentId,
    schoolId,
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (
    student.classId &&
    String(student.classId) !== String(feePlan.classId?._id || feePlan.classId)
  ) {
    throw new ApiError(
      400,
      "This fee plan does not belong to the student's class"
    );
  }

  const totalAmount = Number(feePlan.totalAmount);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new ApiError(400, "Fee plan has an invalid amount");
  }

  let studentFee = await StudentFee.findOne({
    schoolId,
    studentId,
    feePlanId,
  });

  let created = false;

  if (!studentFee) {
    try {
      studentFee = await StudentFee.create({
        schoolId,
        studentId,
        feePlanId,
        title: feePlan.title,
        totalAmount,
        amountPaid: 0,
        balance: totalAmount,
        status: "unpaid",
        type: "debit",
        isFeePlan: true,
        isClassAssignment: false,

        // Use the period on the selected fee plan.
        sessionId: feePlan.sessionId?._id || feePlan.sessionId,
        termId: feePlan.termId?._id || feePlan.termId,
        session: feePlan.sessionId?.name || "",
        term: feePlan.termId?.name || "",
      });

      created = true;
    } catch (err) {
      // Handle a concurrent request assigning the same fee.
      if (err.code !== 11000) throw err;

      studentFee = await StudentFee.findOne({
        schoolId,
        studentId,
        feePlanId,
      });

      if (!studentFee) throw err;
    }
  }

  let invoice = await findInvoiceForFee({
    schoolId,
    studentId,
    studentFee,
  });

  if (!invoice) {
    invoice = await Invoice.create({
      schoolId,
      studentId,
      invoiceNumber: createInvoiceNumber(),
      feeStructureId: feePlan._id,
      title: studentFee.title,
      amount: studentFee.totalAmount,
      totalAmount: studentFee.totalAmount,
      amountPaid: studentFee.amountPaid,
      balanceAmount: studentFee.balance,
      paymentStatus: studentFee.status,
      status: studentFee.status,
      sessionId: studentFee.sessionId,
      termId: studentFee.termId,
      issuedAt: new Date(),
    });
  } else {
    // Do not overwrite existing amounts or payment history.
    await syncInvoiceFromStudentFee({ invoice, studentFee });
  }

  return {
    studentFee,
    invoice,
    message: created
      ? "Fee assigned and invoice created"
      : "Fee already assigned",
  };
}

/* =========================================
   ASSIGN FEE TO AN ENTIRE CLASS
========================================= */

export async function assignFeeToClass({
  schoolId,
  classId,
  feePlanId,
}) {
  validateObjectId(classId, "classId");
  validateObjectId(feePlanId, "feePlanId");

  const feePlan = await FeeStructure.findOne({
    _id: feePlanId,
    schoolId,
    classId,
    isActive: true,
  });

  if (!feePlan) {
    throw new ApiError(
      404,
      "Active fee plan for this class was not found"
    );
  }

  const students = await mongoose.model("Student").find({
    schoolId,
    classId,
  }).select("_id firstName lastName admissionNumber");

  const results = [];

  let assigned = 0;
  let alreadyAssigned = 0;
  let failed = 0;

  for (const student of students) {
    try {
      const result = await assignFeeToStudent({
        schoolId,
        studentId: student._id,
        feePlanId,
      });

      const wasAlreadyAssigned =
        result.message === "Fee already assigned";

      if (wasAlreadyAssigned) {
        alreadyAssigned++;
      } else {
        assigned++;
      }

      results.push({
        studentId: student._id,
        studentName: [
          student.firstName,
          student.lastName,
        ].filter(Boolean).join(" "),
        admissionNumber: student.admissionNumber || "",
        action: wasAlreadyAssigned ? "already_assigned" : "assigned",
        message: result.message,
      });
    } catch (error) {
      failed++;

      results.push({
        studentId: student._id,
        studentName: [
          student.firstName,
          student.lastName,
        ].filter(Boolean).join(" "),
        admissionNumber: student.admissionNumber || "",
        action: "failed",
        error: error?.message || "Fee assignment failed",
      });
    }
  }

  return {
    success: failed === 0,
    message:
      failed === 0
        ? "Class fee assignment completed"
        : "Class fee assignment completed with some failures",
    summary: {
      totalStudents: students.length,
      assigned,
      alreadyAssigned,
      failed,
    },
    data: results,
  };
}

/* =========================================
   LIST INVOICES
========================================= */

export async function listInvoices(schoolId) {
  return Invoice.find({ schoolId })
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .sort({ createdAt: -1 });
}

export async function getStudentInvoices({
  schoolId,
  studentId,
}) {
  return Invoice.find({
    schoolId,
    studentId,
  }).sort({ createdAt: -1 });
}

export async function getClassInvoices({
  schoolId,
  classId,
}) {
  const students = await mongoose.model("Student").find({
    schoolId,
    classId,
  }).select("_id");

  return Invoice.find({
    schoolId,
    studentId: { $in: students.map((student) => student._id) },
  })
    .populate("studentId", "firstName lastName admissionNumber")
    .sort({ createdAt: -1 });
}

/* =========================================
   LIST PAYMENTS
========================================= */

export async function getSchoolPayments(user) {
  const schoolId = normalizeSchoolId(user);

  const payments = await Payment.find({ schoolId })
    .populate({
      path: "studentId",
      select: "firstName lastName admissionNumber classId",
      populate: {
        path: "classId",
        select: "name level",
      },
    })
    .populate({
      path: "studentFeeId",
      select:
        "title totalAmount amountPaid balance status session term sessionId termId",
    })
    .sort({ createdAt: -1 });

  return payments.map((payment) => {
    const student = payment.studentId;
    const fee = payment.studentFeeId;

    return {
      _id: payment._id,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      method: payment.paymentMethod,
      reference: payment.reference,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,

      studentId: student
        ? {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            admissionNumber: student.admissionNumber,
            classId: student.classId || null,
          }
        : null,

      studentName: student
        ? `${student.firstName} ${student.lastName}`
        : "Unknown Student",

      studentFeeId: fee
        ? {
            _id: fee._id,
            title: fee.title,
            totalAmount: fee.totalAmount,
            amountPaid: fee.amountPaid,
            balance: fee.balance,
            status: fee.status,
            session: fee.session,
            term: fee.term,
            sessionId: fee.sessionId,
            termId: fee.termId,
          }
        : null,

      feeBalance: fee?.balance || 0,
    };
  });
}

/* =========================================
   RECORD MANUAL PAYMENT
========================================= */
export async function recordManualPayment({
  schoolId,
  studentId,
  invoiceId,
  studentFeeId,
  amount,
  method,
}) {
  validateObjectId(studentId, "studentId");

  if (!invoiceId && !studentFeeId) {
    throw new ApiError(
      400,
      "Either invoiceId or studentFeeId is required"
    );
  }

  if (invoiceId) validateObjectId(invoiceId, "invoiceId");
  if (studentFeeId) validateObjectId(studentFeeId, "studentFeeId");

  const paymentAmount = Math.round(Number(amount) * 100) / 100;

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    throw new ApiError(400, "Invalid payment amount");
  }

  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();

    let invoice = null;
    let studentFee = null;

    if (invoiceId) {
      invoice = await Invoice.findOne({
        _id: invoiceId,
        schoolId,
        studentId,
      }).session(dbSession);

      if (!invoice) {
        throw new ApiError(404, "Invoice not found");
      }

      if (!invoice.feeStructureId) {
        throw new ApiError(
          409,
          "Invoice is not linked to a fee plan"
        );
      }

      const feeQuery = {
        schoolId,
        studentId,
        feePlanId: invoice.feeStructureId,
        sessionId: invoice.sessionId
          ? invoice.sessionId
          : { $exists: false },
        termId: invoice.termId
          ? invoice.termId
          : { $exists: false },
      };

      studentFee = await StudentFee.findOne(feeQuery)
        .session(dbSession);

      if (!studentFee) {
        throw new ApiError(
          404,
          "Student fee linked to this invoice and academic period was not found"
        );
      }
    } else {
      studentFee = await StudentFee.findOne({
        _id: studentFeeId,
        schoolId,
        studentId,
      }).session(dbSession);

      if (!studentFee) {
        throw new ApiError(404, "Student fee not found");
      }

      invoice = await findInvoiceForFee({
        schoolId,
        studentId,
        studentFee,
        session: dbSession,
      });
    }

    const total = Math.round(
      Number(studentFee.totalAmount || 0) * 100
    ) / 100;

    const alreadyPaid = Math.round(
      Number(studentFee.amountPaid || 0) * 100
    ) / 100;

    if (
      !Number.isFinite(total) ||
      !Number.isFinite(alreadyPaid) ||
      total <= 0 ||
      alreadyPaid < 0 ||
      alreadyPaid > total + 0.01
    ) {
      throw new ApiError(409, "Student fee amounts are invalid");
    }

    const balance = Math.max(
      Math.round((total - alreadyPaid) * 100) / 100,
      0
    );

    if (balance <= 0) {
      throw new ApiError(400, "Fee already fully paid");
    }

    if (paymentAmount > balance + 0.001) {
      throw new ApiError(
        400,
        `Payment exceeds remaining balance (${balance})`
      );
    }

    /**
     * =========================================
     * ENFORCE FEE PAYMENT POLICY
     * =========================================
     */
    const feePlan = await FeeStructure.findOne({
      _id: studentFee.feePlanId,
      schoolId,
    })
      .select("paymentPolicy")
      .session(dbSession);

    const policy = feePlan?.paymentPolicy || {
      mode: "full_only",
    };

    const mode = policy.mode || "full_only";
    const tolerance = 0.01;

    if (mode === "full_only") {
      if (Math.abs(paymentAmount - balance) > tolerance) {
        throw new ApiError(
          400,
          "This fee requires full payment of the outstanding balance"
        );
      }
    } else if (mode === "flexible_partial") {
      const minimum = Number(
        policy.minimumPaymentAmount || 0
      );

      if (
        minimum > 0 &&
        paymentAmount < minimum - tolerance &&
        paymentAmount < balance - tolerance
      ) {
        throw new ApiError(
          400,
          `The minimum payment is ${minimum}`
        );
      }
    } else if (mode === "fixed_installment") {
      const installment = Number(policy.installmentAmount);

      if (!Number.isFinite(installment) || installment <= 0) {
        throw new ApiError(
          400,
          "The fee installment policy is not configured correctly"
        );
      }

      const requiredAmount = Math.min(installment, balance);

      if (
        Math.abs(paymentAmount - requiredAmount) > tolerance
      ) {
        throw new ApiError(
          400,
          `Payment must match the required installment amount of ${requiredAmount}`
        );
      }
    } else {
      throw new ApiError(400, "Unsupported fee payment policy");
    }

    /**
     * =========================================
     * UPDATE FEE BALANCE SAFELY
     * =========================================
     */
    const newAmountPaid = Math.round(
      (alreadyPaid + paymentAmount) * 100
    ) / 100;

    const newBalance = Math.max(
      Math.round((total - newAmountPaid) * 100) / 100,
      0
    );

    const newStatus = paymentStatus(newAmountPaid, total);

    const feeFilter = {
      _id: studentFee._id,
      schoolId,
      studentId,
      totalAmount: studentFee.totalAmount,
      ...(studentFee.amountPaid == null
        ? {
            $or: [
              { amountPaid: { $exists: false } },
              { amountPaid: null },
            ],
          }
        : { amountPaid: studentFee.amountPaid }),
    };

    const feeUpdate = await StudentFee.updateOne(
      feeFilter,
      {
        $set: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newStatus,
        },
      },
      { session: dbSession }
    );

    if (feeUpdate.modifiedCount !== 1) {
      throw new ApiError(
        409,
        "Student fee changed during payment processing. Refresh and try again."
      );
    }

    /**
     * =========================================
     * PAYMENT RECORD
     * =========================================
     */
    const paymentMethod = getPaymentMethod(method);

    const paymentReference =
      `MAN-${new mongoose.Types.ObjectId().toString()}`;

    const [payment] = await Payment.create(
      [
        {
          schoolId,
          studentId,
          studentFeeId: studentFee._id,
          amount: paymentAmount,
          paymentMethod,
          reference: paymentReference,
          status: "success",
          paidAt: new Date(),
          note: "Manual fee payment",
        },
      ],
      { session: dbSession }
    );

    /**
     * =========================================
     * INVOICE
     * =========================================
     */
    if (invoice) {
      invoice.amount = total;
      invoice.totalAmount = total;
      invoice.amountPaid = newAmountPaid;
      invoice.balanceAmount = newBalance;
      invoice.paymentStatus = newStatus;
      invoice.status = newStatus;

      await invoice.save({ session: dbSession });
    }

    /**
     * =========================================
     * LEDGER
     * =========================================
     */
    await Ledger.create(
      [
        {
          schoolId,
          studentId,
          type: "payment",
          amount: paymentAmount,
          balanceAfter: newBalance,
          reference: String(payment._id),
          description: "Manual fee payment",
        },
      ],
      { session: dbSession }
    );

    /**
     * =========================================
     * RECEIPT
     * =========================================
     */
    const receiptMethod =
      paymentMethod === "bank_transfer"
        ? "bank_transfer"
        : paymentMethod === "pos"
          ? "pos"
          : paymentMethod === "online" ||
              paymentMethod === "card"
            ? "manual"
            : paymentMethod;

    const [receipt] = await Receipt.create(
      [
        {
          schoolId,
          paymentId: payment._id,
          studentId,
          studentFeeId: studentFee._id,
          amount: paymentAmount,
          amountPaid: newAmountPaid,
          method: receiptMethod,
          status: "success",
          reference: paymentReference,
          title: studentFee.title,
          totalAmount: total,
          balance: newBalance,
          session: studentFee.session || "",
          term: studentFee.term || "",
          receiptNumber: createReceiptNumber(),
          issuedAt: new Date(),
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    studentFee.amountPaid = newAmountPaid;
    studentFee.balance = newBalance;
    studentFee.status = newStatus;

    return {
      payment,
      receipt,
      studentFee,
      invoice,
    };
  } catch (error) {
    if (dbSession.inTransaction()) {
      await dbSession.abortTransaction();
    }

    throw error;
  } finally {
    await dbSession.endSession();
  }
}

/* =========================================
   CANCEL PAYMENT
========================================= */

export async function cancelPayment(paymentId) {
  validateObjectId(paymentId, "paymentId");

  const dbSession = await mongoose.startSession();

  try {
    dbSession.startTransaction();

    const payment = await Payment.findById(paymentId).session(dbSession);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    if (payment.status !== "success") {
      throw new ApiError(
        400,
        "Only successful payments can be cancelled"
      );
    }

    const studentFee = await StudentFee.findOne({
      _id: payment.studentFeeId,
      schoolId: payment.schoolId,
      studentId: payment.studentId,
    }).session(dbSession);

    if (!studentFee) {
      throw new ApiError(404, "Student fee not found");
    }

    const total = Number(studentFee.totalAmount || 0);
    const currentPaid = Number(studentFee.amountPaid || 0);
    const paymentAmount = Number(payment.amount || 0);

    if (paymentAmount > currentPaid) {
      throw new ApiError(
        409,
        "Payment amount exceeds the recorded paid amount"
      );
    }

    payment.status = "cancelled";
    await payment.save({ session: dbSession });

    studentFee.amountPaid = Math.max(currentPaid - paymentAmount, 0);
    studentFee.balance = Math.max(
      total - studentFee.amountPaid,
      0
    );
    studentFee.status = paymentStatus(
      studentFee.amountPaid,
      total
    );

    await studentFee.save({ session: dbSession });

    const invoice = await findInvoiceForFee({
      schoolId: payment.schoolId,
      studentId: payment.studentId,
      studentFee,
      session: dbSession,
    });

    if (invoice) {
      invoice.amountPaid = studentFee.amountPaid;
      invoice.balanceAmount = studentFee.balance;
      invoice.paymentStatus = studentFee.status;
      invoice.status = studentFee.status;
      await invoice.save({ session: dbSession });
    }

    await Receipt.updateMany(
      {
        schoolId: payment.schoolId,
        paymentId: payment._id,
      },
      {
        $set: { status: "cancelled" },
      },
      { session: dbSession }
    );

    await Ledger.create(
      [
        {
          schoolId: payment.schoolId,
          studentId: payment.studentId,
          type: "adjustment",
          amount: paymentAmount,
          balanceAfter: studentFee.balance,
          reference: String(payment._id),
          description: "Fee payment cancelled",
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    return {
      payment,
      studentFee,
      invoice,
    };
  } catch (err) {
    if (dbSession.inTransaction()) {
      await dbSession.abortTransaction();
    }

    throw err;
  } finally {
    await dbSession.endSession();
  }
}

/* =========================================
   PAYSTACK INITIALIZATION
========================================= */

export async function initializePayment(payload, user) {
  validateObjectId(payload?.invoiceId, "invoiceId");

  const schoolId = normalizeSchoolId(user);

  const invoice = await Invoice.findOne({
    _id: payload.invoiceId,
    schoolId,
  });

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  if (!user?.email) {
    throw new ApiError(400, "User email is required");
  }

  const balance = Number(invoice.balanceAmount || 0);

  if (!Number.isFinite(balance) || balance <= 0) {
    throw new ApiError(400, "Invoice has no outstanding balance");
  }

  const result = await initializePaystackPayment({
    schoolId,
    email: user.email,
    amount: balance,
    callbackUrl: payload.callbackUrl,
    metadata: {
      schoolId: String(schoolId),
      studentId: String(invoice.studentId),
      studentFeeId: String(
        (
          await StudentFee.findOne({
            schoolId,
            studentId: invoice.studentId,
            feePlanId: invoice.feeStructureId,
            ...(invoice.sessionId
              ? { sessionId: invoice.sessionId }
              : {}),
            ...(invoice.termId
              ? { termId: invoice.termId }
              : {}),
          }).select("_id")
        )?._id || ""
      ),
    },
  });

  return {
    authorizationUrl: result.authorizationUrl,
    reference: result.reference,
    accessCode: result.accessCode,
  };
}

/* =========================================
   VERIFY PAYMENT
========================================= */

export async function verifyPayment(reference, schoolId) {
  const result = await verifyPaystackPayment(reference, schoolId);

  if (
    result.status !== "success" ||
    result.currency !== "NGN" ||
    String(result.reference) !== String(reference)
  ) {
    throw new ApiError(400, "Payment has not been verified as successful");
  }

  return result;
}

/* =========================================
   LEGACY WEBHOOK HELPER
========================================= */

export async function handleWebhook(event) {
  if (event?.event !== "charge.success") return null;

  return verifyPayment(
    event.data?.reference,
    event.data?.metadata?.schoolId
  );
}

/* =========================================
   GET ALL INVOICES
========================================= */

export async function getInvoices(user) {
  const schoolId = normalizeSchoolId(user);

  return Invoice.find({ schoolId })
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("sessionId", "name")
    .populate("termId", "name")
    .sort({ createdAt: -1 });
}

/* =========================================
   GET SINGLE INVOICE
========================================= */

export async function getInvoiceById(user, id) {
  validateObjectId(id, "invoiceId");

  const schoolId = normalizeSchoolId(user);

  const invoice = await Invoice.findOne({
    _id: id,
    schoolId,
  })
    .populate("studentId", "firstName lastName admissionNumber")
    .populate("sessionId", "name")
    .populate("termId", "name");

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  return invoice;
}

/* =========================================
   UPDATE INVOICE
========================================= */

export async function updateInvoice(user, id, payload) {
  validateObjectId(id, "invoiceId");

  const schoolId = normalizeSchoolId(user);

  const invoice = await Invoice.findOne({
    _id: id,
    schoolId,
  });

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  // Do not let a general invoice edit rewrite the accounting totals.
  const allowedFields = ["title", "dueDate"];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload || {}, field)) {
      invoice[field] = payload[field];
    }
  }

  await invoice.save();

  return invoice;
}
