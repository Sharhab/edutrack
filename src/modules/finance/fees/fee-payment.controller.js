import {
  createFeePlan,
  assignFeeToStudent,
  assignFeeToClass, // ✅ NEW
  recordManualPayment,
  cancelPayment,
    getSchoolPayments,
  getFeePlans, // optional future use
} from "./fee-payment.service.js";

import mongoose from "mongoose";
import { StudentFee } from "./studentFee.model.js";
import { ApiError } from "../../../utils/apiError.js";
import { processFeePayment } from "../service/processFeePayment.service.js";
import { Receipt } from "../models/receipt.model.js";
import  generateReceiptPDF  from "../service/receiptPdf.service.js";
import Payment from "../models/payment.model.js";

export async function getPaymentsHandler(
  req,
  res
) {
  try {
    const payments =
      await Payment.find({
        schoolId:
          req.user.schoolId,
      })
        .populate(
          "studentId",
          "firstName lastName"
        )
        .populate(
          "studentFeeId"
        )
        .sort({
          createdAt: -1,
        });

    console.log(
      "PAYMENTS:",
      payments.length
    );

    res.json({
      success: true,
      data: payments,
    });
  } catch (err) {
    console.error(
      "GET PAYMENTS ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        err.message,
    });
  }
}
/* =========================================
   VALIDATION HELPER
========================================= */
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/* =========================================
   CREATE FEE PLAN
========================================= */
/* =========================================
   CREATE FEE PLAN
========================================= */
export async function createFeePlanHandler(req, res) {
  const {
    title,
    amount,
    classId,
    sessionId,
    termId,
    description,
  } = req.body;

  if (!title) {
    throw new ApiError(400, "Fee title is required");
  }

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, "Valid amount required");
  }

  if (!classId) {
    throw new ApiError(400, "Class is required");
  }

  if (!sessionId) {
    throw new ApiError(400, "Session is required");
  }

  if (!termId) {
    throw new ApiError(400, "Term is required");
  }

  const data = await createFeePlan({
    schoolId: req.user.schoolId,
    title,
    amount,
    classId,
    sessionId,
    termId,
    description,
  });

  res.json({
    success: true,
    data,
  });
}

/* =========================================
   GET FEE PLANS
========================================= */
export async function getFeePlansHandler(
  req,
  res
) {
  const data =
    await getFeePlans(
      req.user.schoolId
    );

  res.json({
    success: true,
    data,
  });
}

/**
 * GET /finance/fees/student-fees?studentId=xxx
 */
export async function getStudentFeesHandler(
  req,
  res
) {
  try {
    const { studentId } =
      req.query;

    const filter = {
      schoolId:
        req.user.schoolId,
    };

    // OPTIONAL FILTER
    if (studentId) {
      filter.studentId =
        studentId;
    }

    const fees =
      await StudentFee.find(
        filter
      )
        .populate(
          "studentId",
          "firstName lastName"
        )
        .sort({
          createdAt: -1,
        });

    console.log(
      "STUDENT FEES:",
      fees.length
    );

    res.json({
      success: true,
      data: fees,
    });
  } catch (err) {
    console.error(
      "GET STUDENT FEES ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        err.message,
    });
  }
}

/* =========================================
   ASSIGN FEE TO STUDENT (LEGACY SUPPORT)
========================================= */
export async function assignFeeToStudentHandler(req, res) {
  const { studentId, feePlanId } = req.body;

  if (!isValidId(studentId)) {
    throw new ApiError(400, "Invalid student ID");
  }

  if (!isValidId(feePlanId)) {
    throw new ApiError(400, "Invalid fee plan ID");
  }

  const data = await assignFeeToStudent({
    schoolId: req.user.schoolId,
    studentId,
    feePlanId,
  });

  res.json({
    success: true,
    data,
  });
}

/* =========================================
   NEW: ASSIGN FEE TO CLASS (RECOMMENDED)
========================================= */
/* =========================================
   ASSIGN FEE TO CLASS
========================================= */
export async function assignFeeToClassHandler(req, res) {
  const {
    classId,
    feePlanId,
  } = req.body;

  // =====================================
  // VALIDATION
  // =====================================
  if (!isValidId(classId)) {
    throw new ApiError(
      400,
      "Invalid class ID"
    );
  }

  if (!isValidId(feePlanId)) {
    throw new ApiError(
      400,
      "Invalid fee plan ID"
    );
  }

  // =====================================
  // ASSIGN FEES + AUTO CREATE INVOICES
  // =====================================
  const data =
    await assignFeeToClass({
      schoolId:
        req.user.schoolId,

      classId,

      feePlanId,
    });

  res.json({
    success: true,

    message:
      "Fees assigned successfully",

    data,
  });
}

/* =========================================
   GENERATE SINGLE INVOICE
   (OPTIONAL / MANUAL USE)
========================================= */
export async function generateInvoiceHandler(
  req,
  res
) {
  const {
    studentFeeId,
  } = req.body;

  // =====================================
  // VALIDATION
  // =====================================
  if (!isValidId(studentFeeId)) {
    throw new ApiError(
      400,
      "Invalid student fee ID"
    );
  }

  // =====================================
  // FIND STUDENT FEE
  // =====================================
  const studentFee =
    await StudentFee.findOne({
      _id: studentFeeId,

      schoolId:
        req.user.schoolId,
    });

  if (!studentFee) {
    throw new ApiError(
      404,
      "Student fee not found"
    );
  }

  // =====================================
  // PREVENT DUPLICATE INVOICE
  // =====================================
  let invoice =
    await Invoice.findOne({
      schoolId:
        req.user.schoolId,

      studentFeeId:
        studentFee._id,
    });

  // =====================================
  // CREATE INVOICE
  // =====================================
  if (!invoice) {
    invoice =
      await Invoice.create({
        schoolId:
          req.user.schoolId,

        studentId:
          studentFee.studentId,

        studentFeeId:
          studentFee._id,

        feeStructureId:
          studentFee.feePlanId,

        invoiceNumber:
          `INV-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`,

        title:
          studentFee.title,

        amount:
          studentFee.totalAmount,

        totalAmount:
          studentFee.totalAmount,

        amountPaid:
          studentFee.amountPaid || 0,

        balanceAmount:
          studentFee.balance,

        paymentStatus:
          studentFee.balance <= 0
            ? "paid"
            : studentFee.amountPaid > 0
            ? "partial"
            : "unpaid",

        status:
          studentFee.balance <= 0
            ? "paid"
            : studentFee.amountPaid > 0
            ? "partial"
            : "unpaid",

        issuedAt:
          new Date(),
      });
  }

  res.json({
    success: true,

    message:
      "Invoice generated successfully",

    data: invoice,
  });
}
/* =========================================
   LIST INVOICES
========================================= */
export async function listInvoicesHandler(req, res) {
  const data = await listInvoices(req.user.schoolId);

  res.json({
    success: true,
    data,
  });
}

/* =========================================
   GET STUDENT INVOICES (OPTIONAL API)
========================================= */
export async function getStudentInvoicesHandler(req, res) {
  const { studentId } = req.params;

  if (!isValidId(studentId)) {
    throw new ApiError(400, "Invalid student ID");
  }

  const data = await getStudentInvoices({
    schoolId: req.user.schoolId,
    studentId,
  });

  res.json({
    success: true,
    data,
  });
}

/* =========================================
   GET CLASS INVOICES (OPTIONAL API)
========================================= */
export async function getClassInvoicesHandler(req, res) {
  const { classId } = req.params;

  if (!isValidId(classId)) {
    throw new ApiError(400, "Invalid class ID");
  }

  const data = await getClassInvoices({
    schoolId: req.user.schoolId,
    classId,
  });

  res.json({
    success: true,
    data,
  });
}

/* =========================================
   PAYMENTS LIST
========================================= */
export async function listPaymentsHandler(req, res) {
  const data = await getSchoolPayments(req.user);

  res.json({
    success: true,
    data,
  });
}

export async function recordManualPaymentHandler(
  req,
  res
) {
  const {
    studentId,
    studentFeeId,
    amount,
    method,
  } = req.body;

  console.log(
    "\n================ PAYMENT DEBUG ================"
  );

  console.log("REQ BODY:", req.body);

  console.log("studentId:", studentId);

  console.log(
    "studentFeeId:",
    studentFeeId
  );

  console.log("amount:", amount);

  console.log("method:", method);

  console.log(
    "schoolId:",
    req.user.schoolId
  );

  // =====================================
  // VALIDATE STUDENT
  // =====================================
  if (!isValidId(studentId)) {
    console.log(
      "❌ INVALID STUDENT ID:",
      studentId
    );

    throw new ApiError(
      400,
      "Invalid student ID"
    );
  }

  // =====================================
  // VALIDATE STUDENT FEE
  // =====================================
  if (!isValidId(studentFeeId)) {
    console.log(
      "❌ INVALID STUDENT FEE ID:",
      studentFeeId
    );

    throw new ApiError(
      400,
      "Invalid student fee ID"
    );
  }

  // =====================================
  // FIND STUDENT FEE
  // =====================================
  const studentFee =
    await StudentFee.findOne({
      _id: studentFeeId,

      schoolId:
        req.user.schoolId,
    });

  console.log(
    "FOUND STUDENT FEE:",
    studentFee
  );

  if (!studentFee) {
    console.log(
      "❌ STUDENT FEE NOT FOUND"
    );

    throw new ApiError(
      404,
      "Student fee not found"
    );
  }

  // =====================================
  // VALIDATE AMOUNT
  // =====================================
  if (
    !amount ||
    Number(amount) <= 0
  ) {
    console.log(
      "❌ INVALID AMOUNT:",
      amount
    );

    throw new ApiError(
      400,
      "Invalid payment amount"
    );
  }

  // =====================================
  // RECORD PAYMENT
  // =====================================
  const data =
    await recordManualPayment({
      schoolId:
        req.user.schoolId,

      studentId,

      studentFeeId,

      amount,

      method:
        method || "cash",
    });

  console.log(
    "✅ PAYMENT SUCCESS:",
    data
  );

  console.log(
    "================================================\n"
  );

  return res.json({
    success: true,
    message:
      "Payment recorded successfully",
    data,
  });
}

export async function getSchoolInvoices(req, res) {
  try {
    const schoolId =
      req.user?.schoolId;

    const invoices =
      await StudentFee.find({
        schoolId,
      })
        .populate(
          "studentId",
          "firstName lastName"
        )
        .sort({
          createdAt: -1,
        });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (err) {
    console.error(
      "INVOICE ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to load invoices",
    });
  }
}


/**
 * =========================================
 * GET ALL INVOICES
 * =========================================
 */
export async function getInvoices(req, res) {
  try {
    const schoolId = req.user.schoolId;

    const invoices = await StudentFee.find({ schoolId })
      .populate("studentId", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (err) {
    console.error("GET INVOICES ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Failed to load invoices",
    });
  }
}

/**
 * =========================================
 * GET SINGLE INVOICE
 * =========================================
 */
export async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;
    const schoolId = req.user.schoolId;

 const invoice = await StudentFee.findOne({
  _id: id,
  schoolId,
}).populate({
  path: "studentId",
  select: "firstName lastName admissionNumber classId",
  populate: {
    path: "classId",
    select: "name level",
  },
});

    res.json({
      success: true,
      data: invoice,
    });
  } catch (err) {
    console.error("GET INVOICE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Failed to load invoice",
    });
  }
}

/**
 * =========================================
 * UPDATE INVOICE
 * =========================================
 */
export async function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const schoolId = req.user.schoolId;

    const invoice = await StudentFee.findOne({
      _id: id,
      schoolId,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    Object.assign(invoice, req.body);

    await invoice.save();

    res.json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (err) {
    console.error("UPDATE INVOICE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Failed to update invoice",
    });
  }
}

/* =========================================
   GET RECEIPT
========================================= */

/* =========================================
   CANCEL PAYMENT
========================================= */
export async function cancelPaymentHandler(req, res) {
  const { id } = req.params;

  if (!isValidId(id)) {
    throw new ApiError(400, "Invalid payment ID");
  }

  const data = await cancelPayment(id);

  res.json({
    success: true,
    data,
  });
}