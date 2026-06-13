export type BillingPlan = "starter" | "growth" | "premium";
export type BillingStatus = "active" | "expired" | "pending" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "failed";

export interface Subscription {
  _id: string;
  tenantId: string;
  schoolName?: string;
  plan: BillingPlan;
  amount: number;
  status: BillingStatus;
  billingCycle: "monthly" | "yearly";
  startDate?: string;
  nextRenewalDate?: string;
  expiryDate?: string;
  createdAt?: string;
}

export interface PaymentRecord {
  _id: string;
  tenantId: string;
  schoolName?: string;
  reference?: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[];
  summary?: {
    totalRevenue: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    pendingPayments: number;
  };
}

export interface PaymentListResponse {
  payments: PaymentRecord[];
}

export interface SubscriptionFormValues {
  tenantId: string;
  plan: BillingPlan;
  amount: string;
  status: BillingStatus;
  billingCycle: "monthly" | "yearly";
  startDate: string;
  nextRenewalDate: string;
  expiryDate: string;
}

export interface BillingSummary {
  totalRevenue: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  pendingPayments: number;
}