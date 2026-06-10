import mongoose from "mongoose";

import {
  initializePaystackPayment,
  verifyPaystackPayment,
} from "../payments/paystack.service.js";
import { Session } from "../../sessions/session.model.js";
import { Term } from "../../terms/term.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Payment } from "./fee-payment.model.js";
import { Receipt } from "../models/receipt.model.js";
import { StudentFee } from "./studentFee.model.js";
import { Ledger } from "../models/ledger.model.js";

// ✅ FIX: named export (matches your model file)
import { FeeStructure } from "../models/feeStructure.model.js";

import { ApiError } from "../../../utils/apiError.js";

/* =========================================
   VALIDATION
========================================= */
function validateObjectId(id, field) {
  if (!id) throw new ApiError(400, `${field} is required`);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
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
}) {
  if (!title || !title.trim()) {
    throw new ApiError(
      400,
      "Fee title is required"
    );
  }

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(
      400,
      "Valid amount required"
    );
  }

  if (!classId) {
    throw new ApiError(
      400,
      "Class is required"
    );
  }

  if (!sessionId) {
    throw new ApiError(
      400,
      "Session is required"
    );
  }

  if (!termId) {
    throw new ApiError(
      400,
      "Term is required"
    );
  }

  // ✅ VALIDATE IDS
  validateObjectId(classId, "classId");
  validateObjectId(sessionId, "sessionId");
  validateObjectId(termId, "termId");

  /* =========================================
     VALIDATE CLASS EXISTS
  ========================================= */
  const classExists =
    await mongoose.model("Class").findOne({
      _id: classId,
      schoolId,
    });

  if (!classExists) {
    throw new ApiError(
      404,
      "Class not found"
    );
  }

  /* =========================================
     VALIDATE SESSION EXISTS
  ========================================= */
  const sessionExists =
    await mongoose.model("Session").findOne({
      _id: sessionId,
      schoolId,
    });

  if (!sessionExists) {
    throw new ApiError(
      404,
      "Session not found"
    );
  }

  /* =========================================
     VALIDATE TERM EXISTS
  ========================================= */
  const termExists =
    await mongoose.model("Term").findOne({
      _id: termId,
      schoolId,
    });

  if (!termExists) {
    throw new ApiError(
      404,
      "Term not found"
    );
  }

  /* =========================================
     PREVENT DUPLICATE FEE PLAN
  ========================================= */
  const existingPlan =
    await FeeStructure.findOne({
      schoolId,
      classId,
      sessionId,
      termId,
    });

  if (existingPlan) {
    throw new ApiError(
      409,
      "Fee plan already exists for this class, session and term"
    );
  }

  /* =========================================
     CREATE FEE PLAN
  ========================================= */
  const feePlan =
    await FeeStructure.create({
      schoolId,

      title: title.trim(),

      classId,
      sessionId,
      termId,

      totalAmount: Number(amount),

      items: [
        {
          title: title.trim(),
          amount: Number(amount),
          optional: false,
        },
      ],

      description:
        description || "",

      isActive: true,
    });

  return feePlan;
}

/* =========================================
   LIST FEE PLANS
========================================= */
export async function getFeePlans(
  schoolId
) {
  return FeeStructure.find({
    schoolId,
    isActive: true,
  })
    .populate(
      "classId",
      "name"
    )
    .populate(
      "sessionId",
      "name"
    )
    .populate(
      "termId",
      "name"
    )
    .sort({
      createdAt: -1,
    });
}

/* =========================================
   INVOICE HELPER
========================================= */


/* =========================================
   ASSIGN FEE TO STUDENT
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
  });

  if (!feePlan) {
    throw new ApiError(404, "Fee plan not found");
  }

  const student = await mongoose.model("Student").findOne({
    _id: studentId,
    schoolId,
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // =========================================
  // 🔥 SESSION + TERM CONTEXT (ADDED ONLY)
  // =========================================
  const activeSession = await Session.findOne({
    schoolId,
    isActive: true,
  });

  const activeTerm = await Term.findOne({
    schoolId,
    isActive: true,
  });

  // =========================================
  // 1. CREATE STUDENT FEE (NO DUPLICATES)
  // =========================================
  const studentFee = await StudentFee.findOneAndUpdate(
    {
      schoolId,
      studentId,
      feePlanId,
    },
    {
      $setOnInsert: {
        schoolId,
        studentId,
        feePlanId,

        title: feePlan.title,
        totalAmount: feePlan.totalAmount,
        amountPaid: 0,
        balance: feePlan.totalAmount,

        status: "unpaid",
        type: "debit",

        isFeePlan: true,
        isClassAssignment: false,

        // =========================================
        // 🔥 SESSION + TERM ADDED (SAFE EXTENSION)
        // =========================================
        sessionId: activeSession?._id || null,
        termId: activeTerm?._id || null,

        session: activeSession?.name || "",
        term: activeTerm?.name || "",
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  const isNew =
    studentFee.createdAt.getTime() === studentFee.updatedAt.getTime();

  // =========================================
  // 2. CREATE INVOICE (UNCHANGED LOGIC)
  // =========================================
  let invoice = await Invoice.findOne({
    schoolId,
    studentId,
    feeStructureId: feePlanId,
  });

  if (!invoice) {
    invoice = await Invoice.create({
      schoolId,
      studentId,

      invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,

      feeStructureId: feePlanId,

      amount: feePlan.totalAmount,
      amountPaid: 0,
      balanceAmount: feePlan.totalAmount,

      status: "unpaid",

      issuedAt: new Date(),

      // =========================================
      // 🔥 SESSION + TERM ADDED HERE TOO
      // =========================================
      sessionId: activeSession?._id || null,
      termId: activeTerm?._id || null,

      session: activeSession?.name || "",
      term: activeTerm?.name || "",
    });
  }

  return {
    studentFee,
    invoice,
    message: isNew
      ? "Fee assigned and invoice created"
      : "Fee already assigned",
  };
}


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
  });

  if (!feePlan) {
    throw new ApiError(404, "Fee plan not found");
  }

  const students = await mongoose.model("Student").find({
    schoolId,
    classId,
  });

  // =========================================
  // 🔥 SESSION + TERM CONTEXT (ADDED ONLY)
  // =========================================
  const activeSession = await Session.findOne({
    schoolId,
    isActive: true,
  });

  const activeTerm = await Term.findOne({
    schoolId,
    isActive: true,
  });

  const results = [];

  for (const student of students) {

    const studentFee = await StudentFee.findOneAndUpdate(
      {
        schoolId,
        studentId: student._id,
        feePlanId,
      },
      {
        $setOnInsert: {
          schoolId,
          studentId: student._id,
          feePlanId,

          title: feePlan.title,
          totalAmount: feePlan.totalAmount,
          amountPaid: 0,
          balance: feePlan.totalAmount,

          status: "unpaid",
          type: "debit",

          isFeePlan: true,
          isClassAssignment: true,

          // =========================================
          // 🔥 SESSION + TERM ADDED (SAFE)
          // =========================================
          sessionId: activeSession?._id || null,
          termId: activeTerm?._id || null,

          session: activeSession?.name || "",
          term: activeTerm?.name || "",
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const isNew =
      studentFee.createdAt.getTime() === studentFee.updatedAt.getTime();

    let invoice = await Invoice.findOne({
      schoolId,
      studentId: student._id,
      feeStructureId: feePlanId,
    });

    if (!invoice) {
      invoice = await Invoice.create({
        schoolId,
        studentId: student._id,

        invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,

        feeStructureId: feePlanId,

        amount: feePlan.totalAmount,
        amountPaid: 0,
        balanceAmount: feePlan.totalAmount,

        status: "unpaid",

        issuedAt: new Date(),

        // =========================================
        // 🔥 SESSION + TERM ADDED
        // =========================================
        sessionId: activeSession?._id || null,
        termId: activeTerm?._id || null,

        session: activeSession?.name || "",
        term: activeTerm?.name || "",
      });
    }

    results.push({
      studentId: student._id,
      studentFee,
      invoice,
      created: isNew,
    });
  }

  return {
    success: true,
    message: "Class fee assignment completed",
    data: results,
  };
}
/* =========================================
   LIST INVOICES
========================================= */
export async function listInvoices(schoolId) {
  return Invoice.find({ schoolId })
    .populate("studentId", "firstName lastName")
    .sort({ createdAt: -1 });
}

/* =========================================
   GET STUDENT INVOICES
========================================= */
export async function getStudentInvoices({
  schoolId,
  studentId,
}) {
  return Invoice.find({
    schoolId,
    studentId,
  }).sort({ createdAt: -1 });
}

/* =========================================
   GET CLASS INVOICES
========================================= */
export async function getClassInvoices({
  schoolId,
  classId,
}) {
  return Invoice.find({
    schoolId,
    classId,
  }).populate("studentId", "firstName lastName");
}

/* =========================================
   LIST PAYMENTS (IMPORTANT FIX)
========================================= */
export async function getSchoolPayments(user) {
  const payments = await Payment.find({
    schoolId: user.schoolId,
  })
    .populate({
      path: "studentId",
      select:
        "firstName lastName admissionNumber classId",
      populate: {
        path: "classId",
        select: "name level",
      },
    })
    .populate({
      path: "studentFeeId",
      select:
        "title totalAmount amountPaid balance status session term",
    })
    .sort({
      createdAt: -1,
    });

  return payments.map((p) => ({
    _id: p._id,

    amount: p.amount,

    status: p.status,

    paymentMethod:
      p.paymentMethod || p.method,

    method:
      p.paymentMethod || p.method,

    reference: p.reference,

    paidAt: p.paidAt,

    createdAt: p.createdAt,

    // =========================
    // STUDENT
    // =========================
    studentId: p.studentId
      ? {
          _id: p.studentId._id,

          firstName:
            p.studentId.firstName,

          lastName:
            p.studentId.lastName,

          admissionNumber:
            p.studentId.admissionNumber,

          classId:
            p.studentId.classId || null,
        }
      : null,

    studentName: p.studentId
      ? `${p.studentId.firstName} ${p.studentId.lastName}`
      : "Unknown Student",

    // =========================
    // STUDENT FEE
    // =========================
    studentFeeId: p.studentFeeId
      ? {
          _id: p.studentFeeId._id,

          title:
            p.studentFeeId.title,

          totalAmount:
            p.studentFeeId.totalAmount,

          amountPaid:
            p.studentFeeId.amountPaid,

          balance:
            p.studentFeeId.balance,

          status:
            p.studentFeeId.status,

          session:
            p.studentFeeId.session,

          term:
            p.studentFeeId.term,
        }
      : null,

    feeBalance:
      p.studentFeeId?.balance || 0,
  }));
}
/* =========================================
   MANUAL PAYMENT
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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let studentFee = null;
    let invoice = null;

    // =====================================
    // 1. FIND STUDENT FEE (SOURCE OF TRUTH)
    // =====================================
    if (studentFeeId) {
      studentFee = await StudentFee.findOne({
        _id: studentFeeId,
        schoolId,
      }).session(session);

      if (!studentFee) {
        throw new ApiError(404, "Student fee not found");
      }
    }

    if (invoiceId) {
      invoice = await Invoice.findOne({
        _id: invoiceId,
        schoolId,
      }).session(session);

      if (!invoice) {
        throw new ApiError(404, "Invoice not found");
      }

      // map invoice → studentFee if needed
      studentFee = await StudentFee.findOne({
        studentId,
        feePlanId: invoice.feeStructureId,
        schoolId,
      }).session(session);

      if (!studentFee) {
        throw new ApiError(404, "Linked student fee not found");
      }
    }

    // =====================================
    // 2. VALIDATION
    // =====================================
    const total = Number(studentFee.totalAmount || 0);
    const paid = Number(studentFee.amountPaid || 0);
    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      throw new ApiError(400, "Invalid payment amount");
    }

    const balance = Math.max(total - paid, 0);

    if (balance <= 0) {
      throw new ApiError(400, "Fee already fully paid");
    }

    if (paymentAmount > balance) {
      throw new ApiError(
        400,
        `Payment exceeds remaining balance (${balance})`
      );
    }

    // =====================================
    // 3. CREATE PAYMENT (AUDIT ONLY)
    // =====================================
    const payment = await Payment.create(
      [
        {
          schoolId,
          studentId,
          invoiceId: invoice?._id,
          studentFeeId: studentFee._id,
          amount: paymentAmount,
          method: method || "cash",
          reference: `MAN-${Date.now()}`,
          status: "success",
          paidAt: new Date(),
        },
      ],
      { session }
    );

    // =====================================
    // 4. UPDATE STUDENT FEE (SOURCE OF TRUTH)
    // =====================================
    studentFee.amountPaid = paid + paymentAmount;
    studentFee.balance = Math.max(
      total - studentFee.amountPaid,
      0
    );

    studentFee.status =
      studentFee.balance <= 0
        ? "paid"
        : "partial";

    await studentFee.save({ session });

    // =====================================
    // 5. SYNC INVOICE FROM STUDENT FEE
    // =====================================
    if (invoice) {
      invoice.amountPaid = studentFee.amountPaid;
      invoice.balanceAmount = studentFee.balance;

      invoice.paymentStatus =
        studentFee.status === "paid"
          ? "paid"
          : studentFee.status === "partial"
          ? "partial"
          : "unpaid";

      invoice.status = invoice.paymentStatus;

      await invoice.save({ session });
    }

    // =====================================
    // 6. LEDGER
    // =====================================
    await Ledger.create(
      [
        {
          schoolId,
          studentId,
          type: "payment",
          amount: paymentAmount,
          balanceAfter: studentFee.balance,
          reference: payment[0]._id.toString(),
          description: "Manual payment recorded",
        },
      ],
      { session }
    );

    // =====================================
    // 7. RECEIPT
    // =====================================
    const receipt = await Receipt.create(
      [
        {
          schoolId,
          paymentId: payment[0]._id,
          studentId,
          studentFeeId: studentFee._id,
          amount: paymentAmount,
          method: method || "cash",
          status: "success",
          reference: payment[0].reference,
          title: studentFee.title,
          totalAmount: total,
          amountPaid: studentFee.amountPaid,
          balance: studentFee.balance,
          session: studentFee.session || "",
          term: studentFee.term || "",
          receiptNumber: `RCT-${Date.now()}`,
          issuedAt: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      payment: payment[0],
      receipt: receipt[0],
      studentFee,
      invoice,
    };
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    session.endSession();
  }
}
/* =========================================
   CANCEL PAYMENT
========================================= */
export async function cancelPayment(paymentId) {
  validateObjectId(
    paymentId,
    "paymentId"
  );

  const session =
    await mongoose.startSession();

  session.startTransaction();

  try {
    // =====================================
    // FIND PAYMENT
    // =====================================
    const payment =
      await Payment.findById(
        paymentId
      ).session(session);

    if (!payment) {
      throw new ApiError(
        404,
        "Payment not found"
      );
    }

    if (
      payment.status === "cancelled"
    ) {
      throw new ApiError(
        400,
        "Payment already cancelled"
      );
    }

    // =====================================
    // FIND TARGET
    // =====================================
    let target = null;

    let isInvoice = false;

    if (payment.invoiceId) {
      target = await Invoice.findById(
        payment.invoiceId
      ).session(session);

      isInvoice = true;
    }

    if (
      !target &&
      payment.studentFeeId
    ) {
      target =
        await StudentFee.findById(
          payment.studentFeeId
        ).session(session);

      isInvoice = false;
    }

    if (!target) {
      throw new ApiError(
        404,
        "Payment target not found"
      );
    }

    // =====================================
    // CANCEL PAYMENT
    // =====================================
    payment.status = "cancelled";

    await payment.save({
      session,
    });

    // =====================================
    // NORMALIZE VALUES
    // =====================================
    const total = Number(
      target.totalAmount ??
        target.amount ??
        0
    );

    const paid = Math.max(
      Number(
        target.amountPaid ?? 0
      ) - Number(payment.amount || 0),
      0
    );

    const balance = Math.max(
      total - paid,
      0
    );

    // =====================================
    // UPDATE TARGET
    // =====================================
    target.amountPaid = paid;

    if (isInvoice) {
      target.balanceAmount =
        balance;

      target.paymentStatus =
        paid <= 0
          ? "unpaid"
          : balance <= 0
            ? "paid"
            : "partial";

      target.status =
        balance <= 0
          ? "paid"
          : paid > 0
            ? "partially_paid"
            : "unpaid";
    } else {
      target.balance = balance;

      target.status =
        balance <= 0
          ? "paid"
          : paid > 0
            ? "partial"
            : "unpaid";
    }

    await target.save({
      session,
    });

    // =====================================
    // LEDGER
    // =====================================
    await Ledger.create(
      [
        {
          schoolId:
            payment.schoolId,

          studentId:
            payment.studentId,

          type: "adjustment",

          amount: payment.amount,

          balanceAfter: balance,

          reference:
            payment._id.toString(),

          description:
            "Payment cancelled",
        },
      ],
      { session }
    );

    // =====================================
    // LOAD NORMALIZED PAYMENT
    // =====================================
    const populatedPayment =
      await Payment.findById(
        payment._id
      )
        .populate({
          path: "studentId",
          select:
            "firstName lastName admissionNumber classId",
          populate: {
            path: "classId",
            select:
              "name level",
          },
        })
        .populate({
          path: "studentFeeId",
          select:
            "title totalAmount amountPaid balance status session term",
        })
        .populate({
          path: "invoiceId",
        });

    await session.commitTransaction();

    return {
      _id: populatedPayment._id,

      amount:
        populatedPayment.amount,

      status:
        populatedPayment.status,

      paymentMethod:
        populatedPayment.method ||
        populatedPayment.paymentMethod,

      method:
        populatedPayment.method ||
        populatedPayment.paymentMethod,

      reference:
        populatedPayment.reference,

      paidAt:
        populatedPayment.paidAt,

      createdAt:
        populatedPayment.createdAt,

      // =====================
      // STUDENT
      // =====================
      studentId:
        populatedPayment.studentId
          ? {
              _id:
                populatedPayment
                  .studentId._id,

              firstName:
                populatedPayment
                  .studentId
                  .firstName,

              lastName:
                populatedPayment
                  .studentId
                  .lastName,

              admissionNumber:
                populatedPayment
                  .studentId
                  .admissionNumber,

              classId:
                populatedPayment
                  .studentId
                  .classId || null,
            }
          : null,

      studentName:
        populatedPayment.studentId
          ? `${populatedPayment.studentId.firstName} ${populatedPayment.studentId.lastName}`
          : "Unknown Student",

      // =====================
      // STUDENT FEE
      // =====================
      studentFeeId:
        populatedPayment.studentFeeId
          ? {
              _id:
                populatedPayment
                  .studentFeeId._id,

              title:
                populatedPayment
                  .studentFeeId
                  .title,

              totalAmount:
                populatedPayment
                  .studentFeeId
                  .totalAmount,

              amountPaid:
                populatedPayment
                  .studentFeeId
                  .amountPaid,

              balance:
                populatedPayment
                  .studentFeeId
                  .balance,

              status:
                populatedPayment
                  .studentFeeId
                  .status,

              session:
                populatedPayment
                  .studentFeeId
                  .session,

              term:
                populatedPayment
                  .studentFeeId
                  .term,
            }
          : null,

      feeBalance:
        populatedPayment
          .studentFeeId
          ?.balance || 0,

      invoiceId:
        populatedPayment.invoiceId ||
        null,
    };
  } catch (err) {
    await session.abortTransaction();

    throw err;
  } finally {
    session.endSession();
  }
}

/* =========================================
   PAYSTACK INIT
========================================= */
export async function initializePayment(payload, user) {
  validateObjectId(payload.invoiceId, "invoiceId");

  const invoice = await Invoice.findOne({
    _id: payload.invoiceId,
    schoolId: user.schoolId,
  });

  if (!invoice) throw new ApiError(404, "Invoice not found");

  const paystack = await initializePaystackPayment({
    schoolId: user.schoolId,
    email: user.email,
    amount: invoice.balanceAmount,
    callbackUrl: payload.callbackUrl,
  });

  return {
    authorizationUrl: paystack.authorizationUrl,
    reference: paystack.reference,
  };
}

/* =========================================
   VERIFY PAYMENT
========================================= */
export async function verifyPayment(reference) {
  const result = await verifyPaystackPayment(reference);

  if (result.status !== "success") {
    throw new ApiError(400, "Payment failed");
  }

  return result;
}

/* =========================================
   WEBHOOK
========================================= */
export async function handleWebhook(event) {
  if (event.event !== "charge.success") return;
  return verifyPayment(event.data.reference);
}


function normalizeSchoolId(user) {
  if (!user?.schoolId) {
    throw new ApiError(400, "Invalid school context");
  }

  return new mongoose.Types.ObjectId(
    user.schoolId
  );
}

/**
 * =====================================
 * GET ALL INVOICES
 * =====================================
 */
export async function getInvoices(user) {
  const schoolId = normalizeSchoolId(user);

  const invoices = await Invoice.find({
    schoolId,
  })
    .populate(
      "studentId",
      "firstName lastName admissionNumber"
    )
    .populate("classId", "name")
    .populate("termId", "name")
    .populate("sessionId", "name")
    .sort({ createdAt: -1 });

  return invoices;
}

/**
 * =====================================
 * GET SINGLE INVOICE
 * =====================================
 */
export async function getInvoiceById(user, id) {
  const schoolId = normalizeSchoolId(user);

  const invoice = await Invoice.findOne({
    _id: id,
    schoolId,
  })
    .populate(
      "studentId",
      "firstName lastName admissionNumber"
    )
    .populate("classId", "name")
    .populate("termId", "name")
    .populate("sessionId", "name");

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  return invoice;
}

/**
 * =====================================
 * UPDATE INVOICE
 * =====================================
 */
export async function updateInvoice(
  user,
  id,
  payload
) {
  const schoolId = normalizeSchoolId(user);

  const invoice = await Invoice.findOne({
    _id: id,
    schoolId,
  });

  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }

  Object.assign(invoice, payload);

  await invoice.save();

  return invoice;
}