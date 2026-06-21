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
      _id: user._id.toString(),   // ✅ FIXED
      schoolId: user.schoolId?.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  };
}

export async function logoutUser() {
  return { success: true };
}