
import { School } from "../modules/schools/school.model.js";

export async function runBillingExpiryJob() {
  try {
    const now = new Date();

    // Expire trials that have passed their end date.
    const expiredTrials = await School.updateMany(
      {
        trialEndsAt: { $lte: now },
        subscriptionStatus: "trial",
        billingStatus: "trial",
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

    // Expire paid subscriptions that have passed their expiry date.
    const expiredSubscriptions = await School.updateMany(
      {
        subscriptionExpiresAt: { $lte: now },
        subscriptionStatus: { $in: ["active", "past_due"] },
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

    console.log("Billing expiry job completed", {
      expiredTrials: expiredTrials.modifiedCount,
      expiredSubscriptions: expiredSubscriptions.modifiedCount,
    });
  } catch (error) {
    console.error("Billing expiry job failed:", error);
  }
}
