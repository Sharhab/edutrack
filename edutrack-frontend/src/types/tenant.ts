
export type TenantStatus = "active" | "inactive";

export type TenantPlan = "starter" | "growth" | "premium";

export type TenantSubscriptionStatus =
  | "trial"
  | "inactive"
  | "active"
  | "pending"
  | "past_due"
  | "expired"
  | "cancelled";

export interface Tenant {
  _id: string;

  // Display fields used by the existing tenant UI.
  schoolName: string;
  slug: string;
  adminName?: string;
  adminEmail: string;
  email?: string;
  phone?: string;
  address?: string;

  // School profile information.
  principalName?: string;
  motto?: string;
  domain?: string;
  logo?: string;
  currentSession?: string;
  currentTerm?: string;

  // Plan and subscription information.
  plan: TenantPlan;
  status: TenantStatus;
  isActive?: boolean;
  billingStatus?: string;
  subscriptionStatus?: TenantSubscriptionStatus;
  onboardingStatus?: string;
  billingCycle?: string;

  // Trial and paid subscription dates.
  expiryDate?: string;
  trialStartAt?: string;
  trialEndsAt?: string;
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;

  // Record timestamps.
  createdAt?: string;
  updatedAt?: string;

  // School payment configuration.
  paymentEnabled?: boolean;
  paystackConnected?: boolean;
  paystackVerified?: boolean;
  settlementBank?: string;
  accountNumberLast4?: string;
  connectedAt?: string;
  verificationCheckedAt?: string;

  // School login permissions.
  allowStudentLogin?: boolean;
  allowParentLogin?: boolean;
}

export interface TenantListResponse {
  success?: boolean;
  message?: string;
  data?: Tenant[] | Tenant;
  tenants?: Tenant[];
  summary?: TenantSummary;
}

export interface TenantFormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: TenantPlan;
  status: TenantStatus;
  expiryDate: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  slug?: string;
}

export interface TenantSummary {
  total: number;
  active: number;
  inactive: number;
  premium: number;
}

export interface TenantControlPayload {
  status?: TenantStatus;
  subscriptionStatus?: TenantSubscriptionStatus;
  expiryDate?: string;
}
