import api from "../lib/axios";
import { ResolveTenantResponse, ResolvedTenant } from "../types/tenant-resolver";

const TENANT_RESOLVER_ENDPOINTS = {
  bySlug: (slug: string) => `/public/tenant/slug/${slug}`,
  byDomain: (domain: string) => `/public/tenant/domain/${domain}`,
};

export async function resolveTenantBySlug(slug: string): Promise<ResolvedTenant | null> {
  if (!slug.trim()) return null;

  const { data } = await api.get<ResolveTenantResponse>(
    TENANT_RESOLVER_ENDPOINTS.bySlug(slug)
  );

  return data.tenant || null;
}

export async function resolveTenantByDomain(domain: string): Promise<ResolvedTenant | null> {
  if (!domain.trim()) return null;

  const { data } = await api.get<ResolveTenantResponse>(
    TENANT_RESOLVER_ENDPOINTS.byDomain(domain)
  );

  return data.tenant || null;
}