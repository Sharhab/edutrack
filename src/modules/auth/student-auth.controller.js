
import { z } from "zod";
import { loginStudent } from "./student-auth.service.js";
import { apiResponse } from "../../utils/apiResponse.js";

const studentLoginSchema = z.object({
  tenantSlug: z.string().trim().min(1),
  admissionNumber: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
});

export async function studentLogin(req, res) {
  const input = studentLoginSchema.parse(req.body);
  const data = await loginStudent(input);

  res.cookie("token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return apiResponse(res, 200, "Student login successful", data);
}
