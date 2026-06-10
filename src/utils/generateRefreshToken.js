import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user._id,
      type: "refresh",
    },
    env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
}