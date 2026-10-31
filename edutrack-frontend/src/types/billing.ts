
export type BillingPlan = "starter" | "growth" | "premium";
export type BillingCycle = "monthly" | "quarterly" | "yearly";
export type BillingStatus =
  | "trial"
  | "active"
  | "expired"
  | "pending"
  | "cancelled"
  | "past_due"
  | "suspended";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "abandoned"
  | "refunded";

export interface Subscription {
  _id: string;
  tenantId: string;
  schoolName?: string;
  plan: BillingPlan;
  amount: number;
  status: BillingStatus;
  billingCycle: BillingCycle;
  startDate?: string;
  nextRenewalDate?: string;
  expiryDate?: string;
  createdAt?: string;
}

export interface PaymentRecord {
  _id: string;
  tenantId?: string;
  schoolId?: {
    _id?: string;
    name?: string;
    slug?: string;
    email?: string;
  } | string;
  schoolName?: string;
  subscriptionId?: {
    plan?: string;
    status?: string;
    billingCycle?: string;
  } | string;
  reference?: string;
  amount: number;
  currency?: string;
  status: "pending" | "processing" | "success" |
    "failed" | "abandoned" | "refunded";
  paymentMethod?: string;
  method?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface SubscriptionListResponse {
  subscriptions?: Subscription[];
  summary?: {
    totalRevenue: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    pendingPayments: number;
  };
}

export interface PaymentListResponse {
  payments?: PaymentRecord[];
}

export interface SubscriptionFormValues {
  tenantId: string;
  plan: BillingPlan;
  amount: string;
  status: BillingStatus;
  billingCycle: BillingCycle;
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
