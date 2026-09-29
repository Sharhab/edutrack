import api from "../lib/axios";
import {
  OnboardingFormValues,
  OnboardingPaymentInitPayload,
  OnboardingPaymentResponse,
  OnboardingResponse,
} from "../types/onboarding";

/**
 * =========================
 * ENDPOINTS
 * =========================
 */
const ONBOARDING_ENDPOINTS = {
  create: "/onboarding",
  initializePayment: "/onboarding/paystack/initialize",
};

/**
 * =========================
 * STEP 1 (OPTIONAL LEGACY)
 * =========================
 * ⚠️ Not recommended in SaaS flow
 */
export async function onboardSchool(
  payload: OnboardingFormValues
) {
  const { data } = await api.post<OnboardingResponse>(
    ONBOARDING_ENDPOINTS.create,
    payload
  );

  return data;
}

/**
 * =========================
 * STEP 2: INIT PAYMENT (SAAS CORE)
 * =========================
 */
export async function initializeOnboardingPayment(
  payload: OnboardingPaymentInitPayload
) {
  const { data } =
    await api.post<OnboardingPaymentResponse>(
      ONBOARDING_ENDPOINTS.initializePayment,
      {
        ...payload,

        /**
         * 🔥 CRITICAL FIX:
         * Backend uses metadata for webhook recovery
         * This prevents "School not found" issues
         */
        metadata: {
          onboarding: {
            schoolName: payload.schoolName,
            adminFirstName: payload.adminFirstName,
            adminLastName: payload.adminLastName,
            adminEmail: payload.adminEmail,
            adminPassword: payload.adminPassword,
            phone: payload.phone,
            address: payload.address,
            plan: payload.plan,
            billingCycle: payload.billingCycle,
          },
        },
      }
    );

  return data;
}