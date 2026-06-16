import { School } from "../modules/schools/school.model.js";

/**
 * Extract subdomain:
 * saldefi.edutrack.com.ng → saldefi
 */
function getSubdomain(host) {
  if (!host) return null;

  const parts = host.split(".");

  // localhost case
  if (host.includes("localhost")) return null;

  // remove main domain parts
  if (parts.length < 3) return null;

  return parts[0];
}

export async function subdomainMiddleware(req, res, next) {
  try {
    const host = req.headers.host;
      console.log("HOST:", req.headers.host);
    const slug = getSubdomain(host);

    if (!slug) {
      return next(); // allow main landing site
    }

    const school = await School.findOne({ slug });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found for subdomain",
      });
    }

    req.school = school;
    req.schoolId = school._id;

    next();
  } catch (err) {
    next(err);
  }
}