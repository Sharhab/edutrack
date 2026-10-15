
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
  motto?: string;

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

  trialStartAt?: string | null;
  trialEndsAt?: string | null;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
  logo?: string;

  currentSession?: string;
  currentTerm?: string;

  allowStudentLogin?: boolean;
  allowParentLogin?: boolean;

  paymentSettings?: {
    enabled?: boolean;
    paystack?: {
      connected?: boolean;
      isVerified?: boolean;
      settlementBank?: string;
      accountNumberLast4?: string;
      connectedAt?: string | null;
      verificationCheckedAt?: string | null;
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
  const rawPlan = (
    school.plan ||
    school.subscriptionPlan ||
    "starter"
  ).toLowerCase();

  const plan: Tenant["plan"] = [
    "starter",
    "growth",
    "premium",
  ].includes(rawPlan)
    ? (rawPlan as Tenant["plan"])
    : "starter";

  const subscriptionExpiresAt =
    school.subscriptionExpiresAt || "";

  const trialEndsAt = school.trialEndsAt || "";

  return {
    ...school,

    _id: school._id,
    schoolName: school.name || "Unnamed school",
    slug: school.slug || "",
    adminEmail: school.email || "",
    email: school.email || "",
    adminName: school.principalName || "",
    principalName: school.principalName || "",
    motto: school.motto || "",

    domain:
      school.domain ||
      school.customDomain ||
      school.fullDomain ||
      "",

    plan,
    status: school.isActive ? "active" : "inactive",
    isActive: Boolean(school.isActive),

    billingStatus: school.billingStatus || "unknown",
    subscriptionStatus:
      school.subscriptionStatus || "inactive",
    onboardingStatus: school.onboardingStatus || "pending",
    billingCycle: school.billingCycle || "monthly",

    // Keep trial and paid subscription dates separate.
    expiryDate: subscriptionExpiresAt,
    trialStartAt: school.trialStartAt || "",
    trialEndsAt,
    subscriptionStartedAt:
      school.subscriptionStartedAt || "",
    subscriptionExpiresAt,

    createdAt: school.createdAt || "",
    updatedAt: school.updatedAt || "",
    logo: school.logo || "",

    currentSession: school.currentSession || "",
    currentTerm: school.currentTerm || "",

    allowStudentLogin: school.allowStudentLogin,
    allowParentLogin: school.allowParentLogin,

    paymentEnabled: Boolean(
      school.paymentSettings?.enabled
    ),
    paystackConnected: Boolean(
      school.paymentSettings?.paystack?.connected
    ),
    paystackVerified: Boolean(
      school.paymentSettings?.paystack?.isVerified
    ),
    settlementBank:
      school.paymentSettings?.paystack?.settlementBank || "",
    accountNumberLast4:
      school.paymentSettings?.paystack?.accountNumberLast4 || "",
    connectedAt:
      school.paymentSettings?.paystack?.connectedAt || "",
    verificationCheckedAt:
      school.paymentSettings?.paystack?.verificationCheckedAt ||
      "",
  };
}

export async function getTenants(): Promise<{
  tenants: Tenant[];
  summary: TenantSummary;
}> {
  const { data } = await api.get<TenantApiResponse>(
    TENANT_ENDPOINTS.list
  );

  const rows = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.tenants)
      ? data.tenants
      : [];

  const tenants = rows.map(normalizeTenant);

  return {
    tenants,
    summary: data?.summary || {
      total: tenants.length,
      active: tenants.filter(
        (tenant) => tenant.isActive
      ).length,
      inactive: tenants.filter(
        (tenant) => !tenant.isActive
      ).length,
      premium: tenants.filter(
        (tenant) => tenant.plan === "premium"
      ).length,
    },
  };
}

export async function createTenant(
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
    adminFirstName: payload.adminFirstName,
    adminLastName: payload.adminLastName,
    adminEmail: payload.adminEmail,
    adminPassword: payload.adminPassword,
    slug: payload.slug || undefined,
  };

  const { data } = await api.post(
    TENANT_ENDPOINTS.create,
    requestBody
  );

  const school: ApiSchool = data?.data || data;
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

  const { data } = await api.put(
    TENANT_ENDPOINTS.update(id),
    requestBody
  );

  const school: ApiSchool = data?.data || data;
  return normalizeTenant(school);
}

export async function deleteTenant(
  id: string
): Promise<{ success: boolean }> {
  const { data } = await api.delete(
    TENANT_ENDPOINTS.remove(id)
  );

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
    expiryDate:
      payload.expiryDate === undefined
        ? undefined
        : payload.expiryDate || null,
  };

  const { data } = await api.patch(
    TENANT_ENDPOINTS.control(id),
    requestBody
  );

  const school: ApiSchool = data?.data || data;
  return normalizeTenant(school);
}
