import crypto from "crypto";
import { School } from "../schools/school.model.js";

export async function paystackWebhook(req, res) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.sendStatus(401);
    }

    const event = req.body;

    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const data = event.data;

    const school = await School.findById(data.metadata?.schoolId);

    if (!school) return res.sendStatus(200);

    // 🔥 IDENTITY IS NOW ACTIVE
    school.onboardingStep = "payment_success";
    school.subscriptionStatus = "active";
    school.isActive = true;

    await school.save();

    return res.sendStatus(200);
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return res.sendStatus(200);
  }
}