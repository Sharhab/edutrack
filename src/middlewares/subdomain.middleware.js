import { School } from "../modules/schools/school.model.js";

/**
 * Extract tenant slug from hostname
 *
 * demo-academic.edutrack.cloud -> demo-academic
 * edutrack.cloud -> null
 * www.edutrack.cloud -> null
 * localhost -> null
 * *.onrender.com -> null
 */
function getSubdomain(host) {
  if (!host) return null;

  const hostname = host.split(":")[0].toLowerCase();

  // Local dev
  if (hostname.includes("localhost")) return null;

  // Render
  if (hostname.endsWith(".onrender.com")) return null;

  // Root domains
  if (
    hostname === "edutrack.cloud" ||
    hostname === "www.edutrack.cloud"
  ) {
    return null;
  }

  const parts = hostname.split(".");

  // MUST be at least: subdomain.domain.tld
  if (parts.length < 3) return null;

  return parts[0];
}

export async function subdomainMiddleware(req, res, next) {
  try {
    const host = req.headers.host;

    console.log("HOST:", host);

    const slug = getSubdomain(host);

    console.log("SLUG:", slug);

    // Default tenant context
    req.school = null;
    req.schoolId = null;
    req.tenantSlug = slug;

    /**
     * =========================================
     * ROOT DOMAIN HANDLING (IMPORTANT FIX)
     * =========================================
     * DO NOT block request.
     * JWT will handle tenant resolution.
     */
    if (!slug) {
      console.log("ROOT DOMAIN REQUEST - USING JWT TENANT");
      return next();
    }

    /**
     * =========================================
     * SUBDOMAIN MODE (MULTI-TENANT)
     * =========================================
     */
    const school = await School.findOne({
      $or: [
        { slug },
        { domain: `${slug}.edutrack.cloud` },
      ],
    });

    console.log("FOUND SCHOOL:", school?.name || null);

    if (!school) {
      console.log("SCHOOL NOT FOUND FOR SLUG:", slug);

      return res.status(404).json({
        success: false,
        message: "School not found for subdomain",
      });
    }

    // Block inactive schools
    if (!school.isActive) {
      return res.status(403).json({
        success: false,
        message: "School workspace is inactive",
      });
    }

    req.school = school;
    req.schoolId = school._id;

    console.log("TENANT RESOLVED:", school.name);

    next();
  } catch (err) {
    console.error("SUBDOMAIN MIDDLEWARE ERROR:", err);
    next(err);
  }
}