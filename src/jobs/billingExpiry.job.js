
import { School } from "../modules/schools/school.model.js";
import { Subscription } from "../modules/billing/subscription.model.js";
import { syncSchoolFromSubscription } from "../modules/billing/billing.service.js";

export async function runBillingExpiryJob() {
  const now = new Date();

  try {
    // Collect schools affected by subscriptions expiring in this run.
    const expiringSubscriptions = await Subscription.find({
      $or: [
        {
          status: "trial",
          trialEndsAt: { $lte: now },
        },
        {
          status: { $in: ["active", "past_due"] },
          expiresAt: { $lte: now },
        },
      ],
    })
      .select("schoolId")
      .lean();

    const affectedSchoolIds = new Set(
      expiringSubscriptions
        .map((subscription) => String(subscription.schoolId))
        .filter(Boolean)
    );

    // Also reconcile schools whose stored School expiry has passed.
    const schoolsWithExpiredDates = await School.find({
      billingStatus: { $ne: "blocked" },
      $or: [
        {
          subscriptionStatus: "trial",
          trialEndsAt: { $lte: now },
        },
        {
          subscriptionStatus: { $in: ["active", "past_due"] },
          subscriptionExpiresAt: { $lte: now },
        },
      ],
    })
      .select("_id")
      .lean();

    for (const school of schoolsWithExpiredDates) {
      affectedSchoolIds.add(String(school._id));
    }

    // Expire completed trials. Keep isTrial as historical information.
    const expiredTrials = await Subscription.updateMany(
      {
        status: "trial",
        trialEndsAt: { $lte: now },
      },
      {
        $set: { status: "expired" },
      }
    );

    // Expire paid subscriptions whose term has ended.
    const expiredSubscriptions = await Subscription.updateMany(
      {
        status: { $in: ["active", "past_due"] },
        expiresAt: { $lte: now },
      },
      {
        $set: { status: "expired" },
      }
    );

    // Reconcile each affected school against its remaining valid
    // subscriptions and trial records. A valid alternative subscription
    // can keep the school active.
    let schoolsReconciled = 0;

    for (const schoolId of affectedSchoolIds) {
      await syncSchoolFromSubscription(schoolId);
      schoolsReconciled += 1;
    }

    console.log("Billing expiry job completed", {
      expiredTrials: expiredTrials.modifiedCount ?? 0,
      expiredSubscriptions: expiredSubscriptions.modifiedCount ?? 0,
      schoolsReconciled,
      completedAt: now.toISOString(),
    });

    return {
      expiredTrials: expiredTrials.modifiedCount ?? 0,
      expiredSubscriptions: expiredSubscriptions.modifiedCount ?? 0,
      schoolsReconciled,
    };
  } catch (error) {
    console.error("Billing expiry job failed:", error);
    throw error;
  }
}

