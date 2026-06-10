import { Receipt } from "../finance/models/receipt.model.js";

function generateReceiptNo() {
  return `RCT-${Date.now()}`;
}

export async function createReceipt({
  schoolId,
  paymentId,
  studentId,
  amount,
  method,
}) {
  return Receipt.create({
    schoolId,
    paymentId,
    studentId,
    amount,
    method,
    receiptNumber: generateReceiptNo(),
  });
}

export async function getReceipts(schoolId) {
  return Receipt.find({ schoolId })
    .populate("studentId", "firstName lastName")
    .sort({ createdAt: -1 });
}