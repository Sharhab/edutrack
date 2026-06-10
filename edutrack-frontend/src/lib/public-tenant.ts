import api from "../lib/axios";
import { PublicTenantPageData } from "../types/public-tenant";

const PUBLIC_TENANT_ENDPOINTS = {
  page: (slug: string) => `/public/tenant-page/${slug}`,
};

export async function getPublicTenantPage(
  slug: string
): Promise<PublicTenantPageData> {
  const { data } = await api.get<PublicTenantPageData>(
    PUBLIC_TENANT_ENDPOINTS.page(slug)
  );

  return data;
}