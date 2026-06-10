import { School } from "../schools/school.model.js";
import { initializePaystackPayment } from "../billing/paystack.service.js";

export async function startSchoolPayment(payload) {
  const school = await School.findOne({
    email: payload.adminEmail,
  });

  if (!school) {
    throw new Error("School not found");
  }

  school.onboardingStep = "payment_pending";
  await school.save();

  const payment = await initializePaystackPayment({
    schoolId: school._id,
    email: school.email,
    amount: payload.amount,
    plan: payload.plan,
    billingCycle: payload.billingCycle,
    callbackUrl: payload.callbackUrl,
  });

  return {
    authorizationUrl: payment.authorizationUrl,
    reference: payment.reference,
    schoolId: school._id,
  };
}