export type TenantStatus = "active" | "inactive";

export type TenantSubscriptionStatus =
  | "active"
  | "expired"
  | "pending"
  | "cancelled";

export interface ResolvedTenant {
  _id: string;
  schoolName: string;
  slug: string;

  // branding
  logoUrl?: string;
  themeColor?: string;

  // domain
  domain?: string;

  // contact
  address?: string;
  phone?: string;
  email?: string;

  // system state
  status?: TenantStatus;
  subscriptionStatus?: TenantSubscriptionStatus;
  expiryDate?: string;

  // optional extras
  createdAt?: string;
  updatedAt?: string;
}

export interface ResolveTenantResponse {
  tenant: ResolvedTenant | null;
}