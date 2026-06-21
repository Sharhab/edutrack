import mongoose from "mongoose";

import { School } from "../schools/school.model.js";
import { ApiError } from "../../utils/apiError.js";

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
 * MAP TENANT PAYLOAD
 * =====================================
 */
function mapTenantPayload(school) {
  return {
    _id: safeObjectId(school._id),

    schoolName: school.name,

    slug: school.slug,

    logoUrl: school.logo || "",

    themeColor:
      school.themeColor || "#2563eb",

    domain: school.domain || "",

    email: school.email || "",

    phone: school.phone || "",

    address: school.address || "",

    principalName:
      school.principalName || "",

    status: school.isActive
      ? "active"
      : "inactive",

    subscriptionStatus:
      school.subscriptionStatus || "inactive",

    expiryDate:
      school.expiryDate || null,
  };
}

/**
 * =====================================
 * TENANT VALIDATION
 * =====================================
 */
 /**
 * =====================================
 * TENANT VALIDATION
 * =====================================
 */
function ensureTenantIsUsable(school) {
  if (!school) {
    throw new ApiError(
      404,
      "School not found"
    );
  }

  /**
   * School manually disabled
   */
  if (!school.isActive) {
    throw new ApiError(
      403,
      "School workspace is inactive"
    );
  }

  /**
   * Onboarding suspended
   */
  if (
    school.onboardingStatus ===
    "suspended"
  ) {
    throw new ApiError(
      403,
      "School account suspended"
    );
  }

  /**
   * Billing blocked
   */
  if (
    school.billingStatus ===
    "blocked"
  ) {
    throw new ApiError(
      403,
      "Subscription blocked"
    );
  }

  /**
   * Expired subscription
   */
  if (
    school.billingStatus ===
    "expired"
  ) {
    throw new ApiError(
      403,
      "Subscription expired"
    );
  }

  /**
   * Allowed states:
   *
   * trial
   * active
   * pending_payment
   *
   * These schools should still be able
   * to access:
   *
   * - school landing page
   * - login page
   * - onboarding flow
   * - payment page
   */
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

  /**
   * Allowed subscription states
   */
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
export async function resolveTenantBySlug(slug) {
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

  return {
    tenant:
      mapTenantPayload(school),

   page: {
  schoolName:
    school.name,

  logoUrl:
    school.logo || "",

  themeColor:
    school.themeColor ||
    "#2563eb",

  email:
    school.email || "",

  phone:
    school.phone || "",

  address:
    school.address || "",

  principalName:
    school.principalName || "",

  domain:
    school.domain || "",
},
  };
}