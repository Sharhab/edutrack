export type TenantStatus = "active" | "inactive";

export type TenantSubscriptionStatus =
  | "active"
  | "expired"
  | "pending"
  | "cancelled"
  | "trial"; // ✅ ADD THIS

export interface ResolvedTenant {
  _id: string;
  schoolName: string;
  slug: string;
  currentSession: string;
  currentTerm: string;
  fullDomain?: string;
  // branding
  logoUrl?: string;
  themeColor?: string;
    principalName?: string;
  motto?: string;
    faviconUrl?: string | null;
      customDomain?: string | null;
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
  billing?: {
    status:
      | "trial"
      | "active"
      | "expired"
      | "blocked"
      | "unknown";

    isTrial?: boolean;
    daysLeft?: number | null;
  };

  // optional extras
  createdAt?: string;
  updatedAt?: string;
}
export interface ResolveTenantResponse {
  tenant: ResolvedTenant | null;
}