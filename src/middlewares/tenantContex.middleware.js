import { runWithTenantContext } from "../utils/tenantContext.js";
export function tenantContextMiddleware(
  req,
  res,
  next
) {
  const schoolId =
    req.user?.schoolId ||
    req.schoolId ||
    req.school?._id;

  if (!schoolId) {
    return res.status(403).json({
      success: false,
      message: "Tenant not resolved",
    });
  }

  req.tenant = {
    schoolId: String(schoolId),
  };

  next();
}