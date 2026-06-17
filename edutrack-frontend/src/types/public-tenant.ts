export interface PublicTenantAnnouncement {
  _id: string;
  title: string;
  message: string;
  createdAt?: string;
}

export interface PublicTenantPageData {
  tenant: {
    _id: string;
    schoolName: string;
    slug: string;
    logoUrl?: string;
    themeColor?: string;
    address?: string;
    phone?: string;
    email?: string;
    domain?: string;
    status?: "active" | "inactive";
    subscriptionStatus?: string;
    expiryDate?: string | null;
  };

  page: {
    schoolName: string;
    logoUrl?: string;
    themeColor?: string;
  };

  announcements: PublicTenantAnnouncement[];
}

