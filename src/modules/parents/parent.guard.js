import { Parent } from "./parent.model.js";
import { ApiError } from "../../utils/apiError.js";

export async function getParentProfileByUser(user) {
  if (user.role !== "parent") {
    throw new ApiError(403, "Only parent accounts can access this resource");
  }

  const parent = await Parent.findOne({
    schoolId: user.schoolId,
    userId: user._id,
  });

  if (!parent) {
    throw new ApiError(404, "Parent profile not found");
  }

  return parent;
}

export async function ensureParentOwnsStudent(user, studentId) {
  const parent = await getParentProfileByUser(user);

  const ownsStudent = parent.studentIds.some(
    (id) => id.toString() === studentId.toString()
  );

  if (!ownsStudent) {
    throw new ApiError(403, "You can only access your linked child records");
  }

  return parent;
}