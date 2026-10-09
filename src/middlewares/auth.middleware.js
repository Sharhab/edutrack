import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../modules/users/user.model.js";

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
      decoded = jwt.verify(
        token,
        env.JWT_SECRET
      );

      
    } catch (jwtError) {
      
      return res.status(401).json({
        success: false,
        message: jwtError.message,
      });
    }

    const user = await User.findById(
      decoded.id
    ).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

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
