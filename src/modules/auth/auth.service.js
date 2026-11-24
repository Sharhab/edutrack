
import bcrypt from "bcryptjs";

import { User } from "../users/user.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { School } from "../schools/school.model.js";

import { SchoolAdminLogin } from "../school-monitoring/school-admin-login.model.js";
import { generateToken } from "../../utils/generateToken.js";
import { ApiError } from "../../utils/apiError.js";

const INVALID_CREDENTIALS = "Invalid login details";

/**
 * Find a teacher account using Employee ID.
 *
 * Employee IDs are only unique within a school.
 * Never search globally by employeeId.
 */
async function findTeacherByEmployeeId({
  employeeId,
  tenantSlug,
}) {
  if (!tenantSlug) {
    throw new ApiError(
      401,
      "Enter your school's portal address before using Employee ID"
    );
  }

  const school = await School.findOne({
    slug: tenantSlug.trim().toLowerCase(),
    isActive: true,
  }).select("_id");

  if (!school) {
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  const teacher = await Teacher.findOne({
    schoolId: school._id,
    employeeId: employeeId.trim(),
    isActive: true,
    status: "active",
  }).select("userId");

  if (!teacher) {
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  const user = await User.findOne({
    _id: teacher.userId,
    schoolId: school._id,
    role: "teacher",
  });

  return user;
}

/**
 * LOGIN
 *
 * Supports:
 * - Email + password for existing accounts.
 * - Teacher Employee ID + password with school portal slug.
 *
 * Student login remains in its separate student-auth service.
 */
export async function loginUser({
  identifier,
  email,
  tenantSlug,
  password,
}) {
  const loginIdentifier = String(
    identifier || email || ""
  ).trim();

  if (!loginIdentifier || !password) {
    throw new ApiError(
      400,
      "Login identifier and password are required"
    );
  }

  let user = null;

  if (loginIdentifier.includes("@")) {
    // Preserve existing email login for all existing roles.
    const normalizedEmail = loginIdentifier.toLowerCase();

    user = await User.findOne({
      email: normalizedEmail,
    });
  } else {
    // Non-email identifiers are treated as teacher Employee IDs.
    user = await findTeacherByEmployeeId({
      employeeId: loginIdentifier,
      tenantSlug,
    });
  }

  if (!user) {
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account disabled");
  }

  if (!user.passwordHash) {
    throw new ApiError(
      401,
      INVALID_CREDENTIALS
    );
  }

  const isMatch = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isMatch) {
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  // Update last login.
  user.lastLogin = new Date();
  await user.save();

  // Preserve school administrator login tracking.
  if (user.role === "school_admin" && user.schoolId) {
    try {
      await SchoolAdminLogin.create({
        schoolId: user.schoolId,
        userId: user._id,
        loggedInAt: user.lastLogin,
      });
    } catch (error) {
      console.error(
        "School admin login tracking failed:",
        error.message
      );
    }
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      _id: user._id,
      id: user._id,
      schoolId: user.schoolId,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      role: user.role,
      mustChangePassword: Boolean(user.mustChangePassword),
    },
  };
}

/**
 * CHANGE PASSWORD
 */
export async function changeUserPassword({
  authenticatedUser,
  currentPassword,
  newPassword,
}) {
  const allowedRoles = [
    "school_admin",
    "teacher",
    "parent",
  ];

  if (!allowedRoles.includes(authenticatedUser.role)) {
    throw new ApiError(
      403,
      "Your account is not allowed to change its password here"
    );
  }

  if (!authenticatedUser.schoolId) {
    throw new ApiError(
      403,
      "School account context is missing"
    );
  }

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
    throw new ApiError(
      400,
      "Password is not configured for this account"
    );
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isCurrentPasswordValid) {
    throw new ApiError(
      400,
      "Current password is incorrect"
    );
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

  user.passwordHash = await bcrypt.hash(
    newPassword,
    12
  );

  user.passwordChangedAt = new Date();

  // Completing a password change clears the first-login requirement.
  user.mustChangePassword = false;

  await user.save();

  return { success: true };
}

/**
 * LOGOUT
 */
export async function logoutUser() {
  return { success: true };
}
