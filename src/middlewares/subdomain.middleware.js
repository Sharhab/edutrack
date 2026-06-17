import { School } from "../modules/schools/school.model.js";

/**
 * Extract tenant slug from hostname
 *
 * saldefi.edutrack.cloud -> saldefi
 * edutrack.cloud -> null
 * www.edutrack.cloud -> null
 * localhost -> null
 * *.onrender.com -> null
 */
function getSubdomain(host) {
  if (!host) return null;

  const hostname = host
    .split(":")[0]
    .toLowerCase();

  // Ignore localhost
  if (hostname.includes("localhost")) {
    return null;
  }

  // Ignore Render domains
  if (hostname.endsWith(".onrender.com")) {
    return null;
  }

  // Ignore root domains
  if (
    hostname === "edutrack.cloud" ||
    hostname === "www.edutrack.cloud"
  ) {
    return null;
  }

  const parts = hostname.split(".");

  if (parts.length < 3) {
    return null;
  }

  return parts[0];
}

export async function subdomainMiddleware(
  req,
  res,
  next
) {
  try {
    const host = req.headers.host;

    console.log("HOST:", host);

    const slug = getSubdomain(host);

    console.log("SLUG:", slug);

    // Initialize tenant context
    req.school = null;
    req.schoolId = null;
    req.tenantSlug = slug;

    // Root domain access
    if (!slug) {
      console.log(
        "ROOT DOMAIN REQUEST - SKIPPING TENANT LOOKUP"
      );

      return next();
    }

    const school = await School.findOne({
      $or: [
        { slug },
        {
          domain: `${slug}.edutrack.cloud`,
        },
      ],
    });

    console.log(
      "FOUND SCHOOL:",
      school?.name || null
    );

    if (!school) {
      console.log(
        "SCHOOL NOT FOUND FOR SLUG:",
        slug
      );

      return res.status(404).json({
        success: false,
        message:
          "School not found for subdomain",
      });
    }

    // Block inactive schools
    if (!school.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "School workspace is inactive",
      });
    }

    req.school = school;
    req.schoolId = school._id;

    console.log(
      "TENANT RESOLVED:",
      school.name
    );

    next();
  } catch (err) {
    console.error(
      "SUBDOMAIN MIDDLEWARE ERROR:",
      err
    );

    next(err);
  }
}