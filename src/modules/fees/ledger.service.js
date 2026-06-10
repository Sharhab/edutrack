import { Ledger } from "../finance/models/ledger.model"   

/**
 * =====================================
 * CREATE LEDGER ENTRY
 * =====================================
 */
export async function createLedgerEntry({
  schoolId,
  studentId,
  type,
  amount,
  balanceAfter,
  reference,
  description,
}) {
  return Ledger.create({
    schoolId,
    studentId,
    type,
    amount,
    balanceAfter,
    reference,
    description,
  });
}

/**
 * =====================================
 * GET STUDENT LEDGER
 * =====================================
 */
export async function getStudentLedger(
  studentId,
  schoolId
) {
  return Ledger.find({
    schoolId,
    studentId,
  }).sort({
    createdAt: -1,
  });
}