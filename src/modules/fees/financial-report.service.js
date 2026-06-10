import { Payment } from "./payment.model.js";

import { StudentFee } from "../finance/fees/studentFee.model.js";

/**
 * =====================================
 * FINANCIAL SUMMARY
 * =====================================
 */
export async function getFinancialSummary(
  schoolId
) {
  /**
   * TOTAL PAID
   */
  const paid =
    await Payment.aggregate([
      {
        $match: {
          schoolId,
        },
      },

      {
        $group: {
          _id: null,

          total: {
            $sum:
              "$amountPaid",
          },
        },
      },
    ]);

  /**
   * TOTAL EXPECTED
   */
  const expected =
    await StudentFee.aggregate([
      {
        $match: {
          schoolId,
        },
      },

      {
        $group: {
          _id: null,

          total: {
            $sum:
              "$amountExpected",
          },
        },
      },
    ]);

  /**
   * TOTAL BALANCE
   */
  const balance =
    await StudentFee.aggregate([
      {
        $match: {
          schoolId,
        },
      },

      {
        $group: {
          _id: null,

          total: {
            $sum:
              "$balance",
          },
        },
      },
    ]);

  return {
    totalRevenue:
      paid[0]?.total || 0,

    totalExpected:
      expected[0]?.total ||
      0,

    totalOutstanding:
      balance[0]?.total || 0,
  };
}