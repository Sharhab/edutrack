
import mongoose from "mongoose";
import { Student } from "../students/student.model.js";
import { ApiError } from "../../utils/apiError.js";

export async function getMyStudentProfileHandler(req, res) {
  if (req.user.role !== "student") {
    throw new ApiError(403, "Student access only");
  }

  if (!req.user.schoolId || !req.user.studentId) {
    throw new ApiError(
      403,
      "This student account is not linked to a student record"
    );
  }

  if (!mongoose.Types.ObjectId.isValid(String(req.user.studentId))) {
    throw new ApiError(403, "Invalid student account link");
  }

  const student = await Student.findOne({
    _id: req.user.studentId,
    schoolId: req.user.schoolId,
    status: "active",
  })
    .select(
      "firstName middleName lastName admissionNumber gender classId status"
    )
    .populate("classId", "name level code");

  if (!student) {
    throw new ApiError(
      404,
      "Active student profile or assigned class was not found"
    );
  }

  return res.status(200).json({
    success: true,
    message: "Student profile fetched successfully",
    data: {
      id: student._id,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      fullName: [
        student.firstName,
        student.middleName,
        student.lastName,
      ]
        .filter(Boolean)
        .join(" "),
      admissionNumber: student.admissionNumber,
      gender: student.gender,
      class: student.classId
        ? {
            id: student.classId._id,
            name: student.classId.name,
            level: student.classId.level,
            code: student.classId.code,
          }
        : null,
    },
  });
}
