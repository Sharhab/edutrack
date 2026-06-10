import { School } from "../modules/schools/school.model.js";

export async function tenantMiddleware(
  req,
  res,
  next
) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    /**
     * SCHOOL ID
     */
    const schoolId =
      user.schoolId;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message:
          "School context missing",
      });
    }

    /**
     * FETCH TENANT
     */
    const school =
      await School.findById(
        schoolId
      );

    if (!school) {
      return res.status(404).json({
        success: false,
        message:
          "Tenant not found",
      });
    }

    /**
     * ATTACH TENANT
     */
    req.school = school;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Tenant middleware failed",
    });
  }
}