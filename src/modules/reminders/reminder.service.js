import { Reminder } from "./reminder.model.js";
import { Invoice } from "../fees/fee-invoice.model.js";
import { Student } from "../students/student.model.js";

/**
 * BUILD MESSAGE
 */
function buildMessage(student, invoice) {
  return `Dear Parent, fee reminder for ${student.firstName} ${student.lastName}. Outstanding: ₦${invoice.balanceAmount}. Please pay promptly.`;
}

/**
 * CREATE REMINDER
 */
export async function createReminder(
  schoolId,
  studentId,
  invoiceId
) {
  const student = await Student.findById(studentId);
  const invoice = await Invoice.findById(invoiceId);

  if (!student || !invoice) return null;

  const message = buildMessage(student, invoice);

  return Reminder.create({
    schoolId,
    studentId,
    invoiceId,
    message,
  });
}

/**
 * GET DUE INVOICES
 */
export async function getDueInvoices(schoolId) {
  return Invoice.find({
    schoolId,
    paymentStatus: { $ne: "paid" },
    balanceAmount: { $gt: 0 },
  });
}