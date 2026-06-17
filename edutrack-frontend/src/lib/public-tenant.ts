import api from "../lib/axios";
import { PublicTenantPageData } from "../types/public-tenant";

const PUBLIC_TENANT_ENDPOINTS = {
  page: (slug: string) =>
    `/public/tenant-page/${slug}`,
};

type TenantPageResponse = {
  success: boolean;
  message: string;
  data: PublicTenantPageData;
};

export async function getPublicTenantPage(
  slug: string
): Promise<PublicTenantPageData> {
  const response =
    await api.get<TenantPageResponse>(
      PUBLIC_TENANT_ENDPOINTS.page(slug)
    );

  return response.data.data;
}