import bcrypt from "bcryptjs";
import { User } from "../users/user.model.js";
import { generateToken } from "../../utils/generateToken.js";
import { ApiError } from "../../utils/apiError.js";

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account disabled");
  }

  if (!user.passwordHash) {
    throw new ApiError(500, "User password not configured");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);

return {
  token,

  user: {
    _id: user._id,
    id: user._id,

    schoolId: user.schoolId,

    firstName: user.firstName,
    lastName: user.lastName,

    name:
      `${user.firstName} ${user.lastName}`,

    email: user.email,
    role: user.role,
  },
};
}


export async function changeUserPassword({
  authenticatedUser,
  currentPassword,
  newPassword,
}) {
  const allowedRoles = ["school_admin", "teacher", "parent"];

  if (!allowedRoles.includes(authenticatedUser.role)) {
    throw new ApiError(
      403,
      "Your account is not allowed to change its password here"
    );
  }

  // School-based accounts must have a school association.
  if (!authenticatedUser.schoolId) {
    throw new ApiError(403, "School account context is missing");
  }

  // Find only the authenticated user within their own school.
  // Never accept a user ID or school ID from the request body.
  const user = await User.findOne({
    _id: authenticatedUser._id,
    schoolId: authenticatedUser.schoolId,
    role: authenticatedUser.role,
  });

  if (!user) {
    throw new ApiError(404, "Account not found");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account disabled");
  }

  if (!user.passwordHash) {
    throw new ApiError(400, "Password is not configured for this account");
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isCurrentPasswordValid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const isSamePassword = await bcrypt.compare(
    newPassword,
    user.passwordHash
  );

  if (isSamePassword) {
    throw new ApiError(
      400,
      "New password must be different from the current password"
    );
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);

  // Used to invalidate tokens issued before the password change.
  user.passwordChangedAt = new Date();

  await user.save();

  return { success: true };
}

export async function logoutUser() {
  return { success: true };
}
