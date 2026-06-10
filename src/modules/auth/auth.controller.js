import { loginSchema } from "./auth.validation.js";

import {
  loginUser,
  logoutUser,
} from "./auth.service.js";

import { apiResponse } from "../../utils/apiResponse.js";

/**
 * LOGIN
 */
export async function login(req, res) {
  const parsed = loginSchema.parse(req.body);

  const data = await loginUser(parsed);

  return apiResponse(
    res,
    200,
    "Login successful",
    data
  );
}

/**
 * CURRENT USER
 */
export async function me(req, res) {
  return apiResponse(
    res,
    200,
    "Current user fetched",
    req.user
  );
}

/**
 * LOGOUT
 */
export async function logout(req, res) {
  const data = await logoutUser();

  return apiResponse(
    res,
    200,
    "Logout successful",
    data
  );
}