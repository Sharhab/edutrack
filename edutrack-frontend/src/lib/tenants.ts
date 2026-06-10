import api from "./axios";
import {
  Tenant,
  TenantControlPayload,
  TenantFormValues,
  TenantListResponse,
  TenantSummary,
} from "../types/tenant";



const TENANT_ENDPOINTS = {
  list: "/super-admin/tenants",
  create: "/super-admin/tenants",
  update: (id: string) => `/super-admin/tenants/${id}`,
  remove: (id: string) => `/super-admin/tenants/${id}`,
  control: (id: string) => `/super-admin/tenants/${id}/control`,
};

export async function getTenants(): Promise<{
  tenants: Tenant[];
  summary: TenantSummary;
}> {
  const { data } = await api.get<TenantListResponse>(TENANT_ENDPOINTS.list);

  return {
    tenants: data.tenants || [],
    summary: data.summary || {
      total: 0,
      active: 0,
      inactive: 0,
      premium: 0,
    },
  };
}

export async function createTenant(payload: TenantFormValues): Promise<Tenant> {
  const requestBody = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    plan: payload.plan,
    status: payload.status,
    expiryDate: payload.expiryDate || undefined,
    adminFirstName: payload.adminFirstName,
    adminLastName: payload.adminLastName,
    adminEmail: payload.adminEmail,
    adminPassword: payload.adminPassword,
    slug: payload.slug || undefined,
  };

  const { data } = await api.post(TENANT_ENDPOINTS.create, requestBody);

  return data?.data || data;
}

export async function updateTenant(
  id: string,
  payload: TenantFormValues
): Promise<Tenant> {
  const requestBody = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    plan: payload.plan,
    status: payload.status,
    expiryDate: payload.expiryDate || undefined,
    adminFirstName: payload.adminFirstName,
    adminLastName: payload.adminLastName,
    adminEmail: payload.adminEmail,
    ...(payload.adminPassword ? { adminPassword: payload.adminPassword } : {}),
    slug: payload.slug || undefined,
  };

  const { data } = await api.put(TENANT_ENDPOINTS.update(id), requestBody);

  return data?.data || data;
}

export async function deleteTenant(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete(TENANT_ENDPOINTS.remove(id));

  return data?.data || data || { success: true };
}

export async function controlTenant(
  id: string,
  payload: TenantControlPayload
): Promise<Tenant> {
  const { data } = await api.patch(TENANT_ENDPOINTS.control(id), payload);

  return data?.data || data;
}