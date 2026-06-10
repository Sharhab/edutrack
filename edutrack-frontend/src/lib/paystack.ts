import api from "../lib/axios";

import {
  InitializePaystackPayload,
  InitializePaystackResponse,
  VerifyPaystackResponse,
} from "../types/paystack";

/**
 * PAYSTACK API ENDPOINTS
 */
const PAYSTACK_ENDPOINTS = {
  initialize:
    "/super-admin/billing/paystack/initialize",

  verify: (reference: string) =>
    `/super-admin/billing/paystack/verify/${reference}`,
};

/**
 * INITIALIZE PAYMENT
 */
export async function initializePaystackPayment(
  payload: InitializePaystackPayload
) {
  const { data } =
    await api.post<InitializePaystackResponse>(
      PAYSTACK_ENDPOINTS.initialize,
      {
        schoolId: payload.schoolId,

        email: payload.email,

        amount: payload.amount,

        plan: payload.plan,

        billingCycle:
          payload.billingCycle,

        callbackUrl:
          payload.callbackUrl,
      }
    );

  return data;
}

/**
 * VERIFY PAYMENT
 */
export async function verifyPaystackPayment(
  reference: string
) {
  const { data } =
    await api.get<VerifyPaystackResponse>(
      PAYSTACK_ENDPOINTS.verify(
        reference
      )
    );

  return data;
}