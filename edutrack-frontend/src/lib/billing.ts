import api from "../lib/axios";
import {
  BillingSummary,
  PaymentListResponse,
  PaymentRecord,
  Subscription,
  SubscriptionFormValues,
  SubscriptionListResponse,
} from "../types/billing";

const BILLING_ENDPOINTS = {
  subscriptions: "/super-admin/billing/subscriptions",
  createSubscription: "/super-admin/billing/subscriptions",
  updateSubscription: (id: string) => `/super-admin/billing/subscriptions/${id}`,
  deleteSubscription: (id: string) => `/super-admin/billing/subscriptions/${id}`,
  payments: "/super-admin/billing/payments",
};

export async function getSubscriptions(): Promise<{
  subscriptions: Subscription[];
  summary: BillingSummary;
}> {
  const { data } = await api.get<SubscriptionListResponse>(
    BILLING_ENDPOINTS.subscriptions
  );

  return {
    subscriptions: data.subscriptions || [],
    summary: data.summary || {
      totalRevenue: 0,
      activeSubscriptions: 0,
      expiredSubscriptions: 0,
      pendingPayments: 0,
    },
  };
}

export async function createSubscription(payload: SubscriptionFormValues) {
  const { data } = await api.post<Subscription>(
    BILLING_ENDPOINTS.createSubscription,
    {
      ...payload,
      amount: Number(payload.amount),
    }
  );

  return data;
}

export async function updateSubscription(
  id: string,
  payload: SubscriptionFormValues
) {
  const { data } = await api.put<Subscription>(
    BILLING_ENDPOINTS.updateSubscription(id),
    {
      ...payload,
      amount: Number(payload.amount),
    }
  );

  return data;
}

export async function deleteSubscription(id: string) {
  const { data } = await api.delete(BILLING_ENDPOINTS.deleteSubscription(id));
  return data;
}

export async function getPayments(): Promise<PaymentRecord[]> {
  const { data } = await api.get<PaymentListResponse>(BILLING_ENDPOINTS.payments);
  return data.payments || [];
}