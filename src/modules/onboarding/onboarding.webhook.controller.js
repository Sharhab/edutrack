import { completeOnboarding } from "./onboarding.service.js";
import { School } from "../schools/school.model.js";

export async function paystackWebhookHandler(req, res) {
  const event = req.body;

  if (event.event !== "charge.success") {
    return res.sendStatus(200);
  }

  const data = event.data;

  const payload = JSON.parse(data.metadata?.onboardingData);

  if (!payload) return res.sendStatus(200);

  // 🔥 FINAL SCHOOL CREATION ONLY HERE
  const school = await completeOnboarding(payload);

  await School.findByIdAndUpdate(school.school._id, {
    subscriptionStatus: "active",
    isActive: true,
  });

  return res.sendStatus(200);
}