import { Student } from "../students/student.model.js";

import { Invoice } from "../finance/models/invoice.model.js";
import { Payment } from "../finance/fees/fee-payment.model.js";

import { initializePaystackPayment } from "../finance/payments/paystack.service.js";
import { verifyPaystackPayment } from "../finance/payments/paystack.service.js";

import { StudentFee } from "../finance/fees/studentFee.model.js";
import { Receipt } from "../finance/models/receipt.model.js";
import { Ledger } from "../finance/models/ledger.model.js";

import { ApiError } from "../../utils/apiError.js";

/**
 * =====================================
 * GET PARENT CHILDREN
 * =====================================
 */
export async function getParentChildren(
  parentId,
  schoolId
) {
  return Student.find({
    schoolId,
    parentId,
  }).select(
    "firstName lastName admissionNumber classId"
  );
}

/**
 * =====================================
 * GET CHILD INVOICES
 * =====================================
 */
export async function getParentInvoices(
  studentId,
  schoolId
) {
  return Invoice.find({
    schoolId,
    studentId,
  }).sort({
    createdAt: -1,
  });
}

/**
 * =====================================
 * INIT PAYSTACK PAYMENT
 * =====================================
 */
export async function initializeParentPayment(
  payload,
  parent
) {
  const invoice =
    await Invoice.findOne({
      _id: payload.invoiceId,
      schoolId: parent.schoolId,
    });

  if (!invoice) {
    throw new ApiError(
      404,
      "Invoice not found"
    );
  }

  if (invoice.status === "paid") {
    throw new ApiError(
      400,
      "Invoice already paid"
    );
  }

  const paystack =
    await initializePaystackPayment({
      schoolId: parent.schoolId,

      email: parent.email,

      amount: invoice.amount,

      callbackUrl:
        payload.callbackUrl,

      metadata: {
        invoiceId:
          invoice._id.toString(),

        studentId:
          invoice.studentId.toString(),
      },
    });

  return {
    authorizationUrl:
      paystack.authorizationUrl,

    reference:
      paystack.reference,
  };
}

/**
 * =====================================
 * VERIFY PAYMENT
 * =====================================
 */
export async function verifyParentPayment(
  reference,
  parent
) {
  const verified =
    await verifyPaystackPayment(
      reference
    );

  if (
    verified.status !==
    "success"
  ) {
    throw new ApiError(
      400,
      "Payment verification failed"
    );
  }

  const metadata =
    verified.metadata || {};

  const invoice =
    await Invoice.findOne({
      _id:
        metadata.invoiceId,

      schoolId:
        parent.schoolId,
    });

  if (!invoice) {
    throw new ApiError(
      404,
      "Invoice not found"
    );
  }

  /**
   * AVOID DUPLICATE
   */
  const existingPayment =
    await Payment.findOne({
      reference,
    });

  if (existingPayment) {
    return existingPayment;
  }

  /**
   * CREATE PAYMENT
   */
  const payment =
    await Payment.create({
      schoolId:
        parent.schoolId,

      studentId:
        invoice.studentId,

      feeStructureId:
        invoice.feeStructureId,

      invoiceId:
        invoice._id,

      amountPaid:
        invoice.amount,

      paymentMethod:
        "online",

      reference,

      status:
        "successful",
    });

  /**
   * UPDATE STUDENT FEE
   */
  const studentFee =
    await StudentFee.findOne({
      studentId:
        invoice.studentId,

      feeStructureId:
        invoice.feeStructureId,
    });

  if (studentFee) {
    studentFee.amountPaid +=
      invoice.amount;

    studentFee.balance =
      studentFee.amountExpected -
      studentFee.amountPaid;

    studentFee.status =
      studentFee.balance <= 0
        ? "paid"
        : "partial";

    await studentFee.save();
  }

  /**
   * UPDATE INVOICE
   */
  invoice.status = "paid";

  await invoice.save();

  /**
   * CREATE RECEIPT
   */
  const receipt =
    await Receipt.create({
      schoolId:
        parent.schoolId,

      paymentId:
        payment._id,

      studentId:
        invoice.studentId,

      amount:
        invoice.amount,

      receiptNumber: `RCT-${Date.now()}`,
    });

  /**
   * LEDGER ENTRY
   */
  await Ledger.create({
    schoolId:
      parent.schoolId,

    studentId:
      invoice.studentId,

    paymentId:
      payment._id,

    type: "credit",

    amount:
      invoice.amount,

    description:
      "Online payment received",
  });

  return {
    payment,
    receipt,
  };
}