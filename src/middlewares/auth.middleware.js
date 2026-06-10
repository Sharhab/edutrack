import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../modules/users/user.model.js";

export async function protect(req, res, next) {
  try {
    console.log("\n========== AUTH CHECK ==========");

    console.log("URL:", req.originalUrl);
    console.log("METHOD:", req.method);

    console.log("HEADERS AUTHORIZATION:");
    console.log(req.headers.authorization);

    console.log("COOKIE TOKEN:");
    console.log(req.cookies?.token);

    const bearer = req.headers.authorization;

    const token =
      req.cookies?.token ||
      (bearer && bearer.split(" ")[1]);

    console.log("EXTRACTED TOKEN:");
    console.log(token);

    if (!token) {
      console.log("❌ NO TOKEN FOUND");

      return res.status(401).json({
        success: false,
        message: "Unauthorized - no token",
      });
    }

    console.log("TOKEN LENGTH:", token.length);

    console.log("JWT SECRET EXISTS:");
    console.log(!!env.JWT_SECRET);

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        env.JWT_SECRET
      );

      console.log("✅ TOKEN VERIFIED");
      console.log("DECODED:", decoded);
    } catch (jwtError) {
      console.log("❌ JWT VERIFY FAILED");
      console.log("NAME:", jwtError.name);
      console.log("MESSAGE:", jwtError.message);

      return res.status(401).json({
        success: false,
        message: jwtError.message,
      });
    }

    console.log(
      "LOOKING FOR USER:",
      decoded.id
    );

    const user = await User.findById(
      decoded.id
    ).select("-passwordHash");

    if (!user) {
      console.log(
        "❌ USER NOT FOUND:",
        decoded.id
      );

      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ USER FOUND");

    console.log({
      id: user._id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    });

    req.user = user;

    console.log("✅ AUTH SUCCESS");
    console.log("===============================\n");

    next();
  } catch (error) {
    console.log(
      "❌ AUTH MIDDLEWARE CRASH"
    );
    console.log(error);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
}