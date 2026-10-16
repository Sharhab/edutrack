
import { School } from "../modules/schools/school.model.js";
import { Subscription } from "../modules/billing/subscription.model.js";

export async function runBillingExpiryJob() {
  try {
    const now = new Date();

    // 1. Expire trials whose trial end date has passed.
    const expiredTrials = await Subscription.updateMany(
      {
        status: "trial",
        trialEndsAt: { $lte: now },
      },
      {
        $set: {
          status: "expired",
          isTrial: false,
        },
      }
    );

    await School.updateMany(
      {
        trialEndsAt: { $lte: now },
        subscriptionStatus: "trial",
      },
      {
        $set: {
          billingStatus: "expired",
          subscriptionStatus: "expired",
          onboardingStatus: "suspended",
          isActive: false,
          isTrial: false,
        },
      }
    );

    // 2. Expire paid subscriptions whose expiry date has passed.
    const expiredSubscriptions = await Subscription.updateMany(
      {
        status: { $in: ["active", "past_due"] },
        expiresAt: { $lte: now },
      },
      {
        $set: {
          status: "expired",
        },
      }
    );

    // 3. Update schools whose paid subscription has expired.
    await School.updateMany(
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
          isTrial: false,
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
