"use client";

import Cookies from "js-cookie";
import {
  ROLE_COOKIE_KEY,
  TOKEN_COOKIE_KEY,
  USER_COOKIE_KEY,
} from "../lib/constants";
import { AuthUser } from "../types/auth";

const cookieOptions = {
  expires: 7,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function setAuthCookies(token: string, user: AuthUser) {
  Cookies.set(TOKEN_COOKIE_KEY, token, cookieOptions);

  if (user.role) {
    Cookies.set(ROLE_COOKIE_KEY, user.role, cookieOptions);
  }

  Cookies.set(USER_COOKIE_KEY, JSON.stringify(user), cookieOptions);
}

export function clearAuthCookies() {
  Cookies.remove(TOKEN_COOKIE_KEY);
  Cookies.remove(ROLE_COOKIE_KEY);
  Cookies.remove(USER_COOKIE_KEY);
}

export function getTokenCookie() {
  return Cookies.get(TOKEN_COOKIE_KEY);
}

export function getRoleCookie() {
  return Cookies.get(ROLE_COOKIE_KEY);
}

export function getUserCookie(): AuthUser | null {
  const raw = Cookies.get(USER_COOKIE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}