// jobs/billingExpiry.job.js

import { School } from "../modules/schools/school.model.js";

export async function runBillingExpiryJob() {
  try {
    const now = new Date();

    await School.updateMany(
      {
        billingStatus: "trial",
        trialEndsAt: { $lt: now },
        subscriptionStatus: { $ne: "active" },
      },
      {
        $set: {
          billingStatus: "expired",
          subscriptionStatus: "expired",
          onboardingStatus: "suspended",
          isActive: false,
        },
      }
    );

    console.log("🔥 Billing expiry job completed");
  } catch (error) {
    console.error(
      "❌ Billing expiry job error:",
      error
    );
  }
}