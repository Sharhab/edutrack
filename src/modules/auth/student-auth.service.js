
import bcrypt from "bcryptjs";
import { Student } from "../students/student.model.js";
import { User } from "../users/user.model.js";
import { School } from "../schools/school.model.js";
import { generateToken } from "../../utils/generateToken.js";
import { ApiError } from "../../utils/apiError.js";

export async function loginStudent({ tenantSlug, admissionNumber, password }) {
  const normalizedAdmission = String(admissionNumber || "").trim();

  if (!tenantSlug || !normalizedAdmission || !password) {
    throw new ApiError(400, "School, admission number and password are required");
  }

  const school = await School.findOne({
    slug: String(tenantSlug).trim().toLowerCase(),
    isActive: true,
  }).select("_id settings.allowStudentLogin");

  if (!school || school.settings?.allowStudentLogin === false) {
    throw new ApiError(401, "Invalid school or login credentials");
  }

  // Resolve the student within this school only.
  const student = await Student.findOne({
    schoolId: school._id,
    admissionNumber: normalizedAdmission,
    status: "active",
  }).select("_id schoolId admissionNumber firstName lastName status");

  if (!student) {
    throw new ApiError(401, "Invalid admission number or password");
  }

  const user = await User.findOne({
    schoolId: school._id,
    studentId: student._id,
    role: "student",
    isActive: true,
  });

  if (!user?.passwordHash) {
    throw new ApiError(401, "Student login has not been set up");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);

  if (!matches) {
    throw new ApiError(401, "Invalid admission number or password");
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);

  return {
    token,
    user: {
      _id: String(user._id),
      schoolId: String(school._id),
      studentId: String(student._id),
      firstName: student.firstName,
      lastName: student.lastName,
      role: "student",
      admissionNumber: student.admissionNumber,
    },
  };
}
