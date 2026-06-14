export type TenantStatus = "active" | "inactive";
export type TenantPlan = "starter" | "growth" | "premium";
export type TenantSubscriptionStatus =
  | "active"
  | "expired"
  | "pending"
  | "cancelled";

export interface Tenant {
  _id: string;
  schoolName: string;
  slug: string;
  adminName?: string;
  adminEmail: string;
  phone?: string;
  address?: string;
  plan: TenantPlan;
  status: TenantStatus;
  subscriptionStatus?: TenantSubscriptionStatus;
  expiryDate?: string;
  createdAt?: string;
}

export interface TenantListResponse {
  tenants: Tenant[];
  summary?: TenantSummary;
}

export interface TenantFormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: "starter" | "standard" | "premium";
  status: "active" | "inactive";
  expiryDate: string;

  // ✅ ADMIN FIELDS
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;

  // optional
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