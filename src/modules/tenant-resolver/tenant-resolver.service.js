import mongoose from "mongoose";

import { School } from "../schools/school.model.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * =====================================
 * APP URL
 * =====================================
 */
const APP_URL =
  process.env.APP_URL ||
  "https://edutrack-dpui.onrender.com";

/**
 * =====================================
 * SAFE NORMALIZER
 * =====================================
 */
function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * =====================================
 * SAFE OBJECT ID
 * =====================================
 */
function safeObjectId(id) {
  if (!id) return null;

  if (
    typeof id === "object" &&
    id._bsontype === "ObjectId"
  ) {
    return id;
  }

  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }

  return id;
}

/**
 * =====================================
 * ABSOLUTE FILE URL
 * =====================================
 */
function absoluteFileUrl(path) {
  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  return `${APP_URL}${path}`;
}

/**
 * =====================================
 * MAP TENANT PAYLOAD
 * =====================================
 */
function mapTenantPayload(school) {
  return {
    _id: safeObjectId(school._id),

    schoolName: school.name || "",

    slug: school.slug || "",

    currentSession:
      school.currentSession || "",

    currentTerm:
      school.currentTerm || "",

    logoUrl: absoluteFileUrl(
      school.logo
    ),

    faviconUrl: absoluteFileUrl(
      school.favicon
    ),

    themeColor:
      school.themeColor || "#2563eb",

    domain: school.domain || "",

    fullDomain:
      school.fullDomain || "",

    customDomain:
      school.customDomain || "",

    email:
      school.email || "",

    phone:
      school.phone || "",

    address:
      school.address || "",

    principalName:
      school.principalName || "",

    motto:
      school.motto || "",

    status: school.isActive
      ? "active"
      : "inactive",

    subscriptionStatus:
      school.subscriptionStatus ||
      "trial",

    expiryDate:
      school.subscriptionExpiresAt ||
      null,

    billing: {
      status:
        school.billingStatus ||
        "unknown",

      isTrial:
        school.billingStatus ===
        "trial",

      daysLeft: null,
    },
  };
}

/**
 * =====================================
 * TENANT VALIDATION
 * =====================================
 */
function ensureTenantIsUsable(
  school
) {
  if (!school) {
    throw new ApiError(
      404,
      "School not found"
    );
  }

  if (!school.isActive) {
    throw new ApiError(
      403,
      "School workspace is inactive"
    );
  }

  if (
    school.onboardingStatus ===
    "suspended"
  ) {
    throw new ApiError(
      403,
      "School account suspended"
    );
  }

  if (
    school.billingStatus ===
    "blocked"
  ) {
    throw new ApiError(
      403,
      "Subscription blocked"
    );
  }

  if (
    school.billingStatus ===
    "expired"
  ) {
    throw new ApiError(
      403,
      "Subscription expired"
    );
  }

  const allowedBillingStatuses = [
    "trial",
    "active",
    "pending_payment",
  ];

  if (
    school.billingStatus &&
    !allowedBillingStatuses.includes(
      school.billingStatus
    )
  ) {
    throw new ApiError(
      403,
      "School access restricted"
    );
  }

  const allowedSubscriptionStatuses =
    [
      "trial",
      "pending",
      "active",
    ];

  if (
    school.subscriptionStatus &&
    !allowedSubscriptionStatuses.includes(
      school.subscriptionStatus
    )
  ) {
    throw new ApiError(
      403,
      "Subscription inactive"
    );
  }

  return true;
}

/**
 * =====================================
 * RESOLVE BY SLUG
 * =====================================
 */
export async function resolveTenantBySlug(
  slug
) {
  const normalizedSlug =
    normalize(slug);

  if (!normalizedSlug) {
    throw new ApiError(
      400,
      "Tenant slug is required"
    );
  }

  const school =
    await School.findOne({
      slug: normalizedSlug,
    });

  ensureTenantIsUsable(school);

  return {
    tenant:
      mapTenantPayload(school),
  };
}

/**
 * =====================================
 * RESOLVE BY DOMAIN
 * =====================================
 */
export async function resolveTenantByDomain(
  domain
) {
  const normalizedDomain =
    normalize(domain);

  if (!normalizedDomain) {
    throw new ApiError(
      400,
      "Tenant domain is required"
    );
  }

  const school =
    await School.findOne({
      domain: normalizedDomain,
    });

  ensureTenantIsUsable(school);

  return {
    tenant:
      mapTenantPayload(school),
  };
}

/**
 * =====================================
 * PUBLIC TENANT PAGE
 * =====================================
 */
export async function getPublicTenantPage(
  slug
) {
  const normalizedSlug =
    normalize(slug);

  const school =
    await School.findOne({
      slug: normalizedSlug,
    });

  ensureTenantIsUsable(school);

  const tenant =
    mapTenantPayload(school);

  return {
    tenant,

    page: {
      schoolName:
        tenant.schoolName,

      logoUrl:
        tenant.logoUrl,

      faviconUrl:
        tenant.faviconUrl,

      themeColor:
        tenant.themeColor,

      email:
        tenant.email,

      phone:
        tenant.phone,

      address:
        tenant.address,

      principalName:
        tenant.principalName,

      currentSession:
        tenant.currentSession,

      currentTerm:
        tenant.currentTerm,

      domain:
        tenant.domain,

      fullDomain:
        tenant.fullDomain,

      customDomain:
        tenant.customDomain,

      motto:
        tenant.motto,
    },
  };
}