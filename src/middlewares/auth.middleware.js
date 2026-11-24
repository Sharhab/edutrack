
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../modules/users/user.model.js";

const PASSWORD_CHANGE_ALLOWED_PATHS = [
  "/me",
  "/logout",
  "/change-password",
];

function isPasswordChangeAllowed(req) {
  const pathname = (req.originalUrl || req.path || "")
    .split("?")[0]
    .replace(/\/+$/, "");

  return PASSWORD_CHANGE_ALLOWED_PATHS.some(
    (path) => pathname.endsWith(path)
  );
}

export async function protect(req, res, next) {
  try {
    const bearer = req.headers.authorization;

    const token =
      req.cookies?.token ||
      (bearer && bearer.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - no token",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: jwtError.message,
      });
    }

    const user = await User.findById(decoded.id)
      .select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account disabled",
      });
    }

    // Invalidate tokens issued before a password change.
    if (
      user.passwordChangedAt &&
      decoded.iat &&
      decoded.iat * 1000 < user.passwordChangedAt.getTime()
    ) {
      return res.status(401).json({
        success: false,
        message: "Password changed. Please log in again.",
      });
    }

    req.user = user;

    // A first-login account may only access:
    // /me, /logout and /change-password.
    if (
      user.mustChangePassword &&
      !isPasswordChangeAllowed(req)
    ) {
      return res.status(403).json({
        success: false,
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must change your password before continuing.",
      });
    }

    return next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
}
