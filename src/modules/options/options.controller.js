import {
  getClassOptions,
  getParentOptions,
  getSessionOptions,
  getStudentOptions,
  getSubjectOptions,
  getTeacherOptions,
  getTermOptions,
} from "./options.service.js";

export async function classOptionsHandler(req, res) {
  const data = await getClassOptions(req.user.schoolId);

  res.json({
    success: true,
    message: "Class options fetched successfully",
    data,
  });
}

export async function parentOptionsHandler(req, res) {
  const data = await getParentOptions(req.user.schoolId);

  res.json({
    success: true,
    message: "Parent options fetched successfully",
    data,
  });
}

export async function teacherOptionsHandler(req, res) {
  const data = await getTeacherOptions(req.user.schoolId);

  res.json({
    success: true,
    message: "Teacher options fetched successfully",
    data,
  });
}

export async function studentOptionsHandler(req, res) {
  const data = await getStudentOptions(req.user.schoolId);

  res.json({
    success: true,
    message: "Student options fetched successfully",
    data,
  });
}

export async function sessionOptionsHandler(req, res) {
  const data = await getSessionOptions(req.user.schoolId);

  res.json({
    success: true,
    message: "Session options fetched successfully",
    data,
  });
}

export async function termOptionsHandler(req, res) {
  const data = await getTermOptions(req.user.schoolId);

  res.json({
    success: true,
    message: "Term options fetched successfully",
    data,
  });
}

export async function subjectOptionsHandler(req, res) {
  const data = await getSubjectOptions(req.user.schoolId);

  res.json({
    success: true,
    message: "Subject options fetched successfully",
    data,
  });
}