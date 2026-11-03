
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { User } from "../users/user.model.js";
import { School } from "../schools/school.model.js";
import { ApiError } from "../../utils/apiError.js";

export async function createStudentAccount(student) {
  const school = await School.findById(student.schoolId).select(
    "settings.allowStudentLogin"
  );

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  if (school.settings?.allowStudentLogin === false) {
    return { accountCreated: false, reason: "Student login is disabled" };
  }

  // Do not create a second account if this student already has one.
  const existing = await User.findOne({
    schoolId: student.schoolId,
    studentId: student._id,
    role: "student",
  });

  if (existing) {
    return { accountCreated: false, reason: "Account already exists" };
  }

  // Existing User model requires an email. This internal address is not
  // used for student login; students log in with admission number.
  const internalEmail = `student.${student._id}@login.edutrack.local`;

  const temporaryPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const user = await User.create({
    schoolId: student.schoolId,
    studentId: student._id,
    firstName: student.firstName,
    lastName: student.lastName,
    email: internalEmail,
    passwordHash,
    role: "student",
    isActive: student.status === "active",
  });

  // Return this password only to the authorized enrollment workflow.
  // Never save the plaintext password or log it.
  return {
    accountCreated: true,
    userId: String(user._id),
    admissionNumber: student.admissionNumber,
    temporaryPassword,
    mustChangePassword: true,
  };
}
