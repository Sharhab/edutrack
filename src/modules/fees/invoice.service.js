import { Invoice } from "../finance/models/invoice.model.js";
import { StudentFee } from "../finance/fees/studentFee.model.js";
import { Student } from "../students/student.model.js";

import { ApiError } from "../../utils/apiError.js";

/**
 * =====================================
 * GENERATE INVOICE NUMBER
 * =====================================
 */
function generateInvoiceNumber() {
  return `INV-${Date.now()}`;
}

/**
 * =====================================
 * CREATE INVOICE
 * =====================================
 */
export async function createInvoice(
  payload,
  schoolId
) {
  const student =
    await Student.findOne({
      _id: payload.studentId,
      schoolId,
    });

  if (!student) {
    throw new ApiError(
      404,
      "Student not found"
    );
  }

  const fee =
    await StudentFee.findOne({
      schoolId,
      studentId:
        payload.studentId,
      feeStructureId:
        payload.feeStructureId,
    });

  if (!fee) {
    throw new ApiError(
      404,
      "Fee record not found"
    );
  }

  const invoice =
    await Invoice.create({
      schoolId,

      studentId:
        payload.studentId,

      feeStructureId:
        payload.feeStructureId,

      invoiceNumber:
        generateInvoiceNumber(),

      amount:
        fee.amountExpected,

      status:
        fee.status,

      dueDate:
        payload.dueDate || null,
    });

  return invoice;
}

/**
 * =====================================
 * LIST INVOICES
 * =====================================
 */
export async function listInvoices(
  schoolId
) {
  return Invoice.find({
    schoolId,
  })
    .populate(
      "studentId",
      "firstName lastName admissionNumber"
    )
    .populate(
      "feeStructureId",
      "title amount"
    )
    .sort({
      createdAt: -1,
    });
}

/**
 * =====================================
 * GET STUDENT INVOICES
 * =====================================
 */
export async function getStudentInvoices(
  studentId,
  schoolId
) {
  return Invoice.find({
    schoolId,
    studentId,
  })
    .populate(
      "feeStructureId",
      "title amount"
    )
    .sort({
      createdAt: -1,
    });
}