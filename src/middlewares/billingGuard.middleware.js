// middlewares/billingGuard.middleware.js

import { School } from "../modules/schools/school.model.js";

export async function billingGuard(
  req,
  res,
  next
) {
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

    const school =
      await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const now = new Date();

    /**
     * TRIAL CHECK
     */
    const trialExpired =
      school.billingStatus === "trial" &&
      school.trialEndsAt &&
      now > school.trialEndsAt &&
      school.subscriptionStatus !== "active";

    if (trialExpired) {
      school.billingStatus = "expired";
      school.subscriptionStatus =
        "expired";
      school.onboardingStatus =
        "suspended";
      school.isActive = false;

      await school.save();

      return res.status(403).json({
        success: false,
        code: "TRIAL_EXPIRED",
        message:
          "Your free trial has expired. Please upgrade.",
      });
    }

    /**
     * SUBSCRIPTION CHECK
     */
    const blocked =
      school.subscriptionStatus ===
        "expired" ||
      school.subscriptionStatus ===
        "cancelled";

    if (blocked) {
      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_REQUIRED",
        message:
          "Subscription required to continue.",
      });
    }

    req.school = school;

    req.billing = {
      status:
        school.subscriptionStatus ||
        school.billingStatus,

      isTrial:
        school.billingStatus === "trial",

      daysLeft: school.trialEndsAt
        ? Math.max(
            0,
            Math.ceil(
              (school.trialEndsAt - now) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null,
    };

    next();
  } catch (error) {
    console.error(
      "❌ BILLING GUARD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Billing check failed",
    });
  }
}