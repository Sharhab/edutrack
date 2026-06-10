import { ClassModel } from "../classes/class.model.js";
import { Parent } from "../parents/parent.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Student } from "../students/student.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { SubjectModel } from "../subjects/subject.model.js";

export async function getClassOptions(schoolId) {
  const items = await ClassModel.find({ schoolId })
    .sort({ name: 1 })
    .select("_id name level");

  return items.map((item) => ({
    value: item._id,
    label: item.level ? `${item.name} (${item.level})` : item.name,
    name: item.name,
    level: item.level,
  }));
}

export async function getParentOptions(schoolId) {
  const items = await Parent.find({ schoolId })
    .populate("userId", "firstName lastName email phone")
    .sort({ createdAt: -1 });

  return items.map((item) => ({
    value: item._id,
    label: `${item.userId?.firstName || ""} ${item.userId?.lastName || ""}`.trim(),
    email: item.userId?.email || "",
    phone: item.userId?.phone || "",
    relationshipToStudent: item.relationshipToStudent || "",
  }));
}

export async function getTeacherOptions(schoolId) {
  const items = await Teacher.find({ schoolId })
    .populate("userId", "firstName lastName email phone")
    .sort({ createdAt: -1 });

  return items.map((item) => ({
    value: item._id,
    label: `${item.userId?.firstName || ""} ${item.userId?.lastName || ""}`.trim(),
    email: item.userId?.email || "",
    phone: item.userId?.phone || "",
    employeeId: item.employeeId,
    userId: item.userId?._id || null,
  }));
}

export async function getStudentOptions(schoolId) {
  const items = await Student.find({ schoolId })
    .populate("classId", "name level")
    .sort({ firstName: 1, lastName: 1 });

  return items.map((item) => ({
    value: item._id,
    label: `${item.firstName} ${item.lastName}`.trim(),
    admissionNumber: item.admissionNumber,
    className: item.classId?.name || "",
    classLevel: item.classId?.level || "",
  }));
}

export async function getSessionOptions(schoolId) {
  const items = await Session.find({ schoolId })
    .sort({ createdAt: -1 })
    .select("_id name isCurrent");

  return items.map((item) => ({
    value: item._id,
    label: item.name,
    isCurrent: item.isCurrent,
  }));
}

export async function getTermOptions(schoolId) {
  const items = await Term.find({ schoolId })
    .populate("sessionId", "name")
    .sort({ createdAt: -1 });

  return items.map((item) => ({
    value: item._id,
    label: item.sessionId?.name
      ? `${item.name} - ${item.sessionId.name}`
      : item.name,
    name: item.name,
    sessionName: item.sessionId?.name || "",
    isCurrent: item.isCurrent,
  }));
}

export async function getSubjectOptions(schoolId) {
  const items = await SubjectModel.find({ schoolId, isActive: true })
    .sort({ name: 1 })
    .select("_id name code");

  return items.map((item) => ({
    value: item._id,
    label: item.code ? `${item.name} (${item.code})` : item.name,
    name: item.name,
    code: item.code,
  }));
}