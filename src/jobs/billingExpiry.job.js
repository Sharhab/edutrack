// jobs/billingExpiry.job.js

import { School } from "../modules/schools/school.model.js";

export async function runBillingExpiryJob() {
  try {
    const now = new Date();

    // EXPIRE TRIALS
    await School.updateMany(
      {
        billingStatus: "trial",
        trialEndsAt: { $lt: now },
      },
      {
        $set: {
          billingStatus: "expired",
          isActive: false,
        },
      }
    );

    console.log("🔥 Trial expiry job completed");
  } catch (error) {
    console.error("❌ Billing expiry job error:", error);
  }
}