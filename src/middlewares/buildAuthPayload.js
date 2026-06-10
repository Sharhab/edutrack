import { generateToken } from "../utils/generateToken.js";
import { generateRefreshToken } from "../utils/generateRefreshToken.js";

export function buildAuthPayload(user) {
  const token = generateToken(user);

  const refreshToken =
    generateRefreshToken(user);

  return {
    token,
    refreshToken,

    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId || null,
    },
  };
}