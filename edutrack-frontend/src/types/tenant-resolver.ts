
import type { SchoolBrandColors } from "./settings";

export type TenantStatus = "active" | "inactive";

export type TenantSubscriptionStatus =
  | "active"
  | "expired"
  | "pending"
  | "cancelled"
  | "trial";

export interface ResolvedTenant {
  _id: string;
  schoolName: string;
  slug: string;
  currentSession: string;
  currentTerm: string;
  fullDomain?: string;

  // School branding
  logoUrl?: string;
  themeColor?: string;
  brandColors?: SchoolBrandColors;
  principalName?: string;
  motto?: string;
  faviconUrl?: string | null;

  // Domain
  domain?: string;
  customDomain?: string | null;

  // Contact
  address?: string;
  phone?: string;
  email?: string;

  // System state
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

  // Optional extras
  createdAt?: string;
  updatedAt?: string;
}

export interface ResolveTenantResponse {
  tenant: ResolvedTenant | null;
}
