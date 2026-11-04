
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      schoolId: user.schoolId || null,

      // Link student authentication to the student record.
      ...(user.role === "student" && user.studentId
        ? { studentId: String(user.studentId) }
        : {}),
    },
    env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}
