
import { SchoolAdminActivity } from "./school-admin-activity.model.js";

/**
 * Record an action performed by a school administrator.
 *
 * This function intentionally ignores other roles.
 * Audit logging must not expose passwords, tokens or sensitive data.
 */
export async function logSchoolAdminActivity({
  user,
  action,
  module,
  description,
  entityId = null,
  entityType = null,
  metadata = {},
}) {
  if (user?.role !== "school_admin" || !user?.schoolId || !user?._id) {
    return null;
  }

  try {
    return await SchoolAdminActivity.create({
      schoolId: user.schoolId,
      userId: user._id,
      action,
      module,
      description,
      entityId,
      entityType,
      metadata,
      performedAt: new Date(),
    });
  } catch (error) {
    // Do not break normal school operations if audit logging fails.
    console.error("School admin activity logging failed:", error.message);
    return null;
  }
}
