
import { School } from "../modules/schools/school.model.js";

export async function billingGuard(req, res, next) {
  try {
    const schoolId =
      req.user?.schoolId ||
      req.tenant?.schoolId;

    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: "School context missing",
      });
    }

    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const now = new Date();

    const trialExpired =
      school.subscriptionStatus === "trial" &&
      (
        !school.trialEndsAt ||
        new Date(school.trialEndsAt) <= now
      );

    const paidSubscriptionExpired =
      ["active", "past_due"].includes(
        school.subscriptionStatus
      ) &&
      (
        !school.subscriptionExpiresAt ||
        new Date(school.subscriptionExpiresAt) <= now
      );

    const subscriptionBlocked = [
      "expired",
      "cancelled",
      "suspended",
    ].includes(school.subscriptionStatus);

    if (
      trialExpired ||
      paidSubscriptionExpired ||
      subscriptionBlocked
    ) {
      school.billingStatus = "expired";
      school.subscriptionStatus = "expired";
      school.onboardingStatus = "suspended";
      school.isActive = false;
      school.isTrial = false;

      await school.save();

      return res.status(403).json({
        success: false,
        code: trialExpired
          ? "TRIAL_EXPIRED"
          : "SUBSCRIPTION_REQUIRED",
        message: trialExpired
          ? "Your free trial has expired. Please upgrade to continue."
          : "Your school's subscription has expired. Please renew to continue.",
      });
    }

    // Preserve school context for downstream handlers.
    req.school = school;

    req.billing = {
      status: school.subscriptionStatus || school.billingStatus,
      isTrial: school.subscriptionStatus === "trial",
      daysLeft:
        school.subscriptionStatus === "trial" &&
        school.trialEndsAt
          ? Math.max(
              0,
              Math.ceil(
                (
                  new Date(school.trialEndsAt).getTime() -
                  now.getTime()
                ) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : null,
    };

    return next();
  } catch (error) {
    console.error("❌ BILLING GUARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Billing check failed",
    });
  }
}
