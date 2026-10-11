
import api from "./axios";
import {
  Tenant,
  TenantControlPayload,
  TenantFormValues,
  TenantSummary,
} from "../types/tenant";

const TENANT_ENDPOINTS = {
  list: "/super-admin/tenants",
  create: "/super-admin/tenants",
  update: (id: string) => `/super-admin/tenants/${id}`,
  remove: (id: string) => `/super-admin/tenants/${id}`,
  control: (id: string) => `/super-admin/tenants/${id}/control`,
};

type ApiSchool = {
  _id: string;
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  principalName?: string;
  domain?: string;
  customDomain?: string;
  fullDomain?: string;
  plan?: string;
  subscriptionPlan?: string;
  billingCycle?: string;
  billingStatus?: string;
  subscriptionStatus?: string;
  onboardingStatus?: string;
  isActive?: boolean;
  subscriptionExpiresAt?: string | null;
  trialEndsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  logo?: string;
  currentSession?: string;
  currentTerm?: string;
  paymentSettings?: {
    enabled?: boolean;
    paystack?: {
      connected?: boolean;
      isVerified?: boolean;
      settlementBank?: string;
    };
  };
};

type TenantApiResponse = {
  success?: boolean;
  message?: string;
  data?: ApiSchool[] | ApiSchool;
  tenants?: ApiSchool[];
  summary?: TenantSummary;
};

function normalizeTenant(school: ApiSchool): Tenant {
  const plan = school.plan || school.subscriptionPlan || "starter";

  return {
    _id: school._id,
    schoolName: school.name || "Unnamed school",
    slug: school.slug || "",
    adminName: school.principalName || "",
    adminEmail: school.email || "",
    email: school.email || "",
    phone: school.phone || "",
    address: school.address || "",
    domain: school.domain || school.customDomain || school.fullDomain || "",
    plan: plan === "growth" || plan === "premium" ? plan : "starter",
    status: school.isActive ? "active" : "inactive",
    isActive: Boolean(school.isActive),
    billingStatus: school.billingStatus || "unknown",
    subscriptionStatus: school.subscriptionStatus || "inactive",
    onboardingStatus: school.onboardingStatus || "pending",
    billingCycle: school.billingCycle || "monthly",
    expiryDate: school.subscriptionExpiresAt || school.trialEndsAt || "",
    subscriptionExpiresAt: school.subscriptionExpiresAt || "",
    trialEndsAt: school.trialEndsAt || "",
    createdAt: school.createdAt || "",
    updatedAt: school.updatedAt || "",
    logo: school.logo || "",
    currentSession: school.currentSession || "",
    currentTerm: school.currentTerm || "",
    paymentEnabled: Boolean(school.paymentSettings?.enabled),
    paystackConnected: Boolean(school.paymentSettings?.paystack?.connected),
    paystackVerified: Boolean(school.paymentSettings?.paystack?.isVerified),
    settlementBank: school.paymentSettings?.paystack?.settlementBank || "",
  };
}

export async function getTenants(): Promise<{
  tenants: Tenant[];
  summary: TenantSummary;
}> {
  const { data } = await api.get<TenantApiResponse>(TENANT_ENDPOINTS.list);

  // Current backend responds with { success, message, data: [...] }.
  // Also accept { tenants: [...] } for compatibility with other API versions.
  const rawTenants = Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.tenants)
      ? data.tenants
      : [];

  const tenants = rawTenants.map(normalizeTenant);

  return {
    tenants,
    summary: data.summary || {
      total: tenants.length,
      active: tenants.filter((tenant) => tenant.isActive).length,
      inactive: tenants.filter((tenant) => !tenant.isActive).length,
      premium: tenants.filter((tenant) => tenant.plan === "premium").length,
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
    isActive: payload.status === "active",
    expiryDate: payload.expiryDate || undefined,
    adminFirstName: payload.adminFirstName,
    adminLastName: payload.adminLastName,
    adminEmail: payload.adminEmail,
    adminPassword: payload.adminPassword,
    slug: payload.slug || undefined,
  };

  const { data } = await api.post(TENANT_ENDPOINTS.create, requestBody);
  const school = data?.data || data;

  return normalizeTenant(school);
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
    isActive: payload.status === "active",
    expiryDate: payload.expiryDate || undefined,
    slug: payload.slug || undefined,
  };

  const { data } = await api.put(TENANT_ENDPOINTS.update(id), requestBody);
  const school = data?.data || data;

  return normalizeTenant(school);
}

export async function deleteTenant(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete(TENANT_ENDPOINTS.remove(id));
  return data?.data || data || { success: true };
}

export async function controlTenant(
  id: string,
  payload: TenantControlPayload
): Promise<Tenant> {
  const requestBody = {
    isActive:
      payload.status === undefined
        ? undefined
        : payload.status === "active",
    subscriptionStatus: payload.subscriptionStatus,
    expiryDate: payload.expiryDate || null,
  };

  const { data } = await api.patch(TENANT_ENDPOINTS.control(id), requestBody);
  return normalizeTenant(data?.data || data);
}
