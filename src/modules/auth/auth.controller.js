
import {
  loginSchema,
  changePasswordSchema,
} from "./auth.validation.js";

import {
  loginUser,
  logoutUser,
  changeUserPassword,
} from "./auth.service.js";

import { apiResponse } from "../../utils/apiResponse.js";

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

/**
 * LOGIN
 */
export async function login(req, res, next) {
  try {
    const parsed = loginSchema.parse(req.body);

    const data = await loginUser(parsed);

    res.cookie("token", data.token, AUTH_COOKIE_OPTIONS);

    return apiResponse(
      res,
      200,
      "Login successful",
      data
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * CURRENT USER
 */
export async function me(req, res, next) {
  try {
    return apiResponse(
      res,
      200,
      "Current user fetched",
      req.user
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * CHANGE PASSWORD
 */
export async function changePassword(req, res, next) {
  try {
    const parsed = changePasswordSchema.parse(req.body);

    await changeUserPassword({
      authenticatedUser: req.user,
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
    });

    res.clearCookie("token", AUTH_COOKIE_OPTIONS);

    return apiResponse(
      res,
      200,
      "Password changed successfully. Please log in again.",
      { requiresLogin: true }
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * LOGOUT
 */
export async function logout(req, res, next) {
  try {
    const data = await logoutUser();

    res.clearCookie("token", AUTH_COOKIE_OPTIONS);

    return apiResponse(
      res,
      200,
      "Logout successful",
      data
    );
  } catch (error) {
    return next(error);
  }
}
