import { runWithTenantContext } from "../utils/tenantContext.js";

export function tenantContextMiddleware(req, res, next) {
  const schoolId =
    req.schoolId ||
    req.school?._id ||
    req.user?.schoolId;

  if (!schoolId) {
    return res.status(403).json({
      success: false,
      message: "Tenant not resolved",
    });
  }

  const tenant = {
    schoolId: String(schoolId),
    school: req.school || null,
  };

  req.tenant = tenant;

  return runWithTenantContext(tenant, () => next());
}