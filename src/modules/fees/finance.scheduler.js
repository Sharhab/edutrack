import cron from "node-cron";

import { FeeStructure } from "../finance/models/feeStructure.model.js";

import { generateInvoicesForFee } from "./invoice.generator.js";

/**
 * =====================================
 * DAILY FINANCE JOB
 * =====================================
 *
 * RUNS EVERY DAY AT 1AM
 */
export function startFinanceScheduler() {
  cron.schedule(
    "0 1 * * *",
    async () => {
      console.log(
        "Running finance scheduler..."
      );

      try {
        /**
         * FIND ACTIVE FEES
         */
        const fees =
          await FeeStructure.find({
            isActive: true,
          });

        for (const fee of fees) {
          try {
            await generateInvoicesForFee(
              fee._id,
              fee.schoolId
            );

            console.log(
              `Invoices generated for ${fee.title}`
            );
          } catch (err) {
            console.error(
              "Invoice generation failed:",
              err.message
            );
          }
        }

        console.log(
          "Finance scheduler completed"
        );
      } catch (err) {
        console.error(
          "Finance scheduler error:",
          err.message
        );
      }
    }
  );
}