import { School } from "../schools/school.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * =========================
 * PAYSTACK WEBHOOK (FIXED)
 * =========================
 */
export async function paystackWebhookHandler(req, res) {
  try {
    const event = req.body;

    console.log("💰 PAYSTACK EVENT:", JSON.stringify(event, null, 2));

    /**
     * ONLY HANDLE SUCCESS EVENT
     */
    if (event.event !== "charge.success") {
      return res.status(200).json({ success: true });
    }

    const data = event.data;
    const metadata = data?.metadata;

    if (!metadata?.schoolId) {
      throw new ApiError(400, "Missing school metadata");
    }

    const schoolId = metadata.schoolId;

    /**
     * FIND SCHOOL
     */
    const school = await School.findById(schoolId);

    if (!school) {
      throw new ApiError(404, "School not found");
    }

    /**
     * PREVENT DOUBLE ACTIVATION
     */
    if (school.onboardingStatus === "active") {
      console.log("⚠️ Already activated:", schoolId);
      return res.json({ success: true, message: "Already active" });
    }

    /**
     * ACTIVATE SCHOOL
     */
    school.isActive = true;
    school.onboardingStatus = "active";
    school.subscriptionStatus = "active";

    await school.save();

    /**
     * ACTIVATE USERS
     */
    await User.updateMany(
      { schoolId },
      { isActive: true }
    );

    console.log("🎉 SCHOOL ACTIVATED:", schoolId);

    return res.json({ success: true });
  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}