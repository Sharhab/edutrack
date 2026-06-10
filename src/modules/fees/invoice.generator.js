import { Student } from "../students/student.model.js";

import { FeeStructure } from "../finance/models/feeStructure.model.js";

import { StudentFee } from "../finance/fees/studentFee.model.js";

import { Invoice } from "../finance/models/invoice.model.js"

/**
 * =====================================
 * GENERATE INVOICE NUMBER
 * =====================================
 */
function generateInvoiceNumber() {
  return `INV-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;
}

/**
 * =====================================
 * AUTO GENERATE INVOICES
 * =====================================
 */
export async function generateInvoicesForFee(
  feeStructureId,
  schoolId
) {
  /**
   * FIND FEE STRUCTURE
   */
  const fee =
    await FeeStructure.findOne({
      _id: feeStructureId,
      schoolId,
    });

  if (!fee) {
    throw new Error(
      "Fee structure not found"
    );
  }

  /**
   * FIND STUDENTS
   */
  const students =
    await Student.find({
      schoolId,
      classId: fee.classId,
    });

  const invoices = [];

  /**
   * LOOP STUDENTS
   */
  for (const student of students) {
    /**
     * CREATE STUDENT FEE
     */
    let studentFee =
      await StudentFee.findOne({
        schoolId,
        studentId: student._id,
        feeStructureId:
          fee._id,
      });

    if (!studentFee) {
      studentFee =
        await StudentFee.create({
          schoolId,

          studentId:
            student._id,

          feeStructureId:
            fee._id,

          amountExpected:
            fee.amount,

          amountPaid: 0,

          balance:
            fee.amount,

          status:
            "unpaid",
        });
    }

    /**
     * CHECK EXISTING INVOICE
     */
    const existingInvoice =
      await Invoice.findOne({
        schoolId,
        studentId:
          student._id,
        feeStructureId:
          fee._id,
      });

    if (existingInvoice) {
      continue;
    }

    /**
     * CREATE INVOICE
     */
    const invoice =
      await Invoice.create({
        schoolId,

        studentId:
          student._id,

        feeStructureId:
          fee._id,

        invoiceNumber:
          generateInvoiceNumber(),

        amount:
          fee.amount,

        status:
          "pending",

        dueDate:
          fee.dueDate ||
          null,
      });

    invoices.push(invoice);
  }

  return invoices;
}