
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
  updateSubscription: (id: string) =>
    `/super-admin/billing/subscriptions/${id}`,
  deleteSubscription: (id: string) =>
    `/super-admin/billing/subscriptions/${id}`,
  payments: "/super-admin/billing/payments",
};

type BackendSubscription = {
  _id: string;
  schoolId?: string | {
    _id?: string;
    name?: string;
    schoolName?: string;
  };
  plan: Subscription["plan"];
  amount: number;
  status: Subscription["status"];
  billingCycle?: Subscription["billingCycle"];
  startsAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
};

type SubscriptionApiResponse = {
  subscription?: BackendSubscription;
  data?: BackendSubscription;
  subscriptions?: BackendSubscription[];
  summary?: BillingSummary;
};

function getSchoolId(
  schoolId: BackendSubscription["schoolId"]
): string {
  if (typeof schoolId === "string") return schoolId;
  return schoolId?._id || "";
}

function normalizeSubscription(
  raw: BackendSubscription
): Subscription {
  const school =
    typeof raw.schoolId === "object" && raw.schoolId !== null
      ? raw.schoolId
      : null;

  return {
    _id: raw._id,
    tenantId: getSchoolId(raw.schoolId),
    schoolName: school?.name || school?.schoolName || "",
    plan: raw.plan,
    amount: Number(raw.amount || 0),
    status: raw.status,
    billingCycle: raw.billingCycle || "monthly",
    startDate: raw.startsAt || "",
    nextRenewalDate: raw.expiresAt || "",
    expiryDate: raw.expiresAt || "",
    createdAt: raw.createdAt,
  };
}

function toBackendPayload(payload: SubscriptionFormValues) {
  return {
    schoolId: payload.tenantId,
    plan: payload.plan,
    amount: Number(payload.amount),
    status: payload.status,
    billingCycle: payload.billingCycle,
    startsAt: payload.startDate
      ? new Date(
          `${payload.startDate}T00:00:00.000Z`
        ).toISOString()
      : null,
    expiresAt: payload.expiryDate
      ? new Date(
          `${payload.expiryDate}T00:00:00.000Z`
        ).toISOString()
      : null,
  };
}

export async function getSubscriptions(): Promise<{
  subscriptions: Subscription[];
  summary: BillingSummary;
}> {
  const { data } = await api.get<SubscriptionApiResponse>(
    BILLING_ENDPOINTS.subscriptions
  );

  const rawSubscriptions = data.subscriptions || [];

  return {
    subscriptions: rawSubscriptions.map(normalizeSubscription),
    summary: data.summary || {
      totalRevenue: 0,
      activeSubscriptions: 0,
      expiredSubscriptions: 0,
      pendingPayments: 0,
    },
  };
}

export async function createSubscription(
  payload: SubscriptionFormValues
): Promise<Subscription> {
  const { data } = await api.post<SubscriptionApiResponse>(
    BILLING_ENDPOINTS.createSubscription,
    toBackendPayload(payload)
  );

  const subscription = data.subscription || data.data;

  if (!subscription) {
    throw new Error(
      "The server did not return the created subscription."
    );
  }

  return normalizeSubscription(subscription);
}

export async function updateSubscription(
  id: string,
  payload: SubscriptionFormValues
): Promise<Subscription> {
  const { data } = await api.put<SubscriptionApiResponse>(
    BILLING_ENDPOINTS.updateSubscription(id),
    toBackendPayload(payload)
  );

  const subscription = data.subscription || data.data;

  if (!subscription) {
    throw new Error(
      "The server did not return the updated subscription."
    );
  }

  return normalizeSubscription(subscription);
}

export async function deleteSubscription(id: string) {
  const { data } = await api.delete(
    BILLING_ENDPOINTS.deleteSubscription(id)
  );

  return data;
}

export async function getPayments(): Promise<PaymentRecord[]> {
  const { data } = await api.get<PaymentListResponse>(
    BILLING_ENDPOINTS.payments
  );

  return data.payments || [];
}
