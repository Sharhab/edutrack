import { loginSchema } from "./auth.validation.js";
import { loginUser, logoutUser } from "./auth.service.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { changePasswordSchema } from "./auth.validation.js";
import { changeUserPassword } from "./auth.service.js";
/**
 * LOGIN
 */
export async function login(req, res) {
  const parsed = loginSchema.parse(req.body);

  const data = await loginUser(parsed);

  // ✅ SET COOKIE (IMPORTANT FIX)
  res.cookie("token", data.token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return apiResponse(res, 200, "Login successful", data);
}

/**
 * ME
 */
export async function me(req, res) {
  return apiResponse(res, 200, "Current user fetched", req.user);
}

export async function changePassword(req, res) {
  const parsed = changePasswordSchema.parse(req.body);

  await changeUserPassword({
    authenticatedUser: req.user,
    currentPassword: parsed.currentPassword,
    newPassword: parsed.newPassword,
  });

  // Existing tokens will be invalidated by the middleware change below.
  // Clear the current cookie so the user can log in again.
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  return apiResponse(
    res,
    200,
    "Password changed successfully. Please log in again.",
    { requiresLogin: true }
  );
}

/**
 * LOGOUT
 */
export async function logout(req, res) {
  res.clearCookie("token");

  const data = await logoutUser();

  return apiResponse(res, 200, "Logout successful", data);
}
