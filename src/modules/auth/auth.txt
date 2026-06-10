
import bcrypt from "bcryptjs";

import { User } from "../users/user.model.js";
import { generateToken } from "../../utils/generateToken.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * LOGIN USER
 */
export async function loginUser({
  email,
  password,
}) {
  const normalizedEmail = String(email)
    .trim()
    .toLowerCase();

  /**
   * FIND USER
   */
  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new ApiError(
      401,
      "Invalid email or password"
    );
  }

  /**
   * CHECK ACTIVE
   */
  if (user.isActive === false) {
    throw new ApiError(
      403,
      "Account disabled"
    );
  }

  /**
   * CHECK PASSWORD FIELD
   */
  if (!user.passwordHash) {
    console.log(
      "❌ passwordHash missing for:",
      user.email
    );

    throw new ApiError(
      500,
      "User password not configured"
    );
  }

  /**
   * VERIFY PASSWORD
   */
  const isMatch = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isMatch) {
    throw new ApiError(
      401,
      "Invalid email or password"
    );
  }

  /**
   * UPDATE LOGIN
   */
  user.lastLogin = new Date();

  await user.save();

  /**
   * TOKEN
   */
  const token = generateToken(user);

  return {
    token,

    user: {
      id: user._id,
      schoolId: user.schoolId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * LOGOUT
 */
export async function logoutUser() {
  return {
    success: true,
  };
}