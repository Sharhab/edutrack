import { StudentFee } from "../finance/fees/studentFee.model.js";

/**
 * =====================================
 * GET FEE DEFAULTERS
 * =====================================
 */
export async function getDefaulters(
  schoolId
) {
  return StudentFee.find({
    schoolId,

    status: {
      $in: [
        "unpaid",
        "partial",
      ],
    },

    balance: {
      $gt: 0,
    },
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
      balance: -1,
    });
}