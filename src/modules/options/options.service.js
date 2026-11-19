import { ClassModel } from "../classes/class.model.js";
import { Parent } from "../parents/parent.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Student } from "../students/student.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { ApiError } from "../../utils/apiError.js";

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
  const items = await Teacher.find({
    schoolId,
    isActive: true,
    status: "active",
  })
    .populate("userId", "firstName lastName email phone")
    .select("userId employeeId subjectIds classIds assignments")
    .sort({ createdAt: -1 })
    .lean();

  return items.map((item) => ({
    value: item._id,
    label: `${item.userId?.firstName || ""} ${
      item.userId?.lastName || ""
    }`.trim(),
    email: item.userId?.email || "",
    phone: item.userId?.phone || "",
    employeeId: item.employeeId,
    userId: item.userId?._id || null,
  }));
}

export async function getStudentOptions(schoolId) {
  const items = await Student.find({
    schoolId,
    status: "active",
  })
    .populate("classId", "name level")
    .sort({ firstName: 1, lastName: 1 })
    .select("_id admissionNumber firstName middleName lastName classId");

  return items.map((item) => {
    const fullName = [
      item.firstName,
      item.middleName,
      item.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const className = item.classId
      ? item.classId.level
        ? `${item.classId.name} (${item.classId.level})`
        : item.classId.name
      : "";

    return {
      value: String(item._id),
      label: className
        ? `${fullName} — ${className}`
        : fullName,
      name: fullName,
      admissionNumber: item.admissionNumber,
      classId: item.classId?._id
        ? String(item.classId._id)
        : null,
      className,
    };
  });
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
export async function getSubjectOptions(
  schoolId,
  { classId, userId, role } = {}
) {
  // 1. If a class is selected, confirm it belongs to this school.
  if (classId) {
    const schoolClass = await ClassModel.findOne({
      _id: classId,
      schoolId,
      isActive: { $ne: false },
    }).select("_id");

    if (!schoolClass) {
      throw new ApiError(404, "Class not found in this school");
    }
  }

  // 2. Start with active subjects belonging to this school.
  const subjectQuery = {
    schoolId,
    isActive: true,
  };

  // Only subjects explicitly assigned to the selected class.
  if (classId) {
    subjectQuery.classIds = classId;
  }

  // 3. For teachers, restrict subjects to explicit class-subject assignments.
  if (role === "teacher") {
    const teacher = await Teacher.findOne({
      schoolId,
      userId,
      status: "active",
      isActive: true,
    })
      .select("assignments")
      .lean();

    if (!teacher) {
      throw new ApiError(403, "Active teacher profile not found");
    }

    const allowedSubjectIds = [
      ...new Set(
        (teacher.assignments || [])
          .filter((assignment) => {
            if (!assignment.classId || !assignment.subjectId) {
              return false;
            }

            // When a class is selected, require an exact class match.
            return (
              !classId ||
              String(assignment.classId) === String(classId)
            );
          })
          .map((assignment) => String(assignment.subjectId))
      ),
    ];

    if (!allowedSubjectIds.length) {
      return [];
    }

    subjectQuery._id = { $in: allowedSubjectIds };
  }

  // 4. Fetch only subjects that passed the school/class/teacher filters.
  const items = await SubjectModel.find(subjectQuery)
    .sort({ name: 1 })
    .select("_id name code classIds")
    .lean();

  return items.map((item) => ({
    value: String(item._id),
    label: item.code
      ? `${item.name} (${item.code})`
      : item.name,
    name: item.name,
    code: item.code || "",
    classIds: (item.classIds || []).map(String),
  }));
}

