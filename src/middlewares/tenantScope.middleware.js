export function tenantScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (!req.user.schoolId) {
    return res.status(403).json({
      success: false,
      message: "School scope missing",
    });
  }

  /**
   * Attach tenant scope
   */
  req.tenant = {
    schoolId: req.user.schoolId,
  };

  next();
}