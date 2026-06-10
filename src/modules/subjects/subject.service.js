import { SubjectModel } from "./subject.model.js";
import { ClassModel } from "../classes/class.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/apiError.js";

async function validateClassIds(classIds, schoolId) {
  if (!classIds?.length) return;

  const count = await ClassModel.countDocuments({
    _id: { $in: classIds },
    schoolId,
  });

  if (count !== classIds.length) {
    throw new ApiError(400, "One or more selected classes are invalid");
  }
}

async function validateTeacherIds(teacherIds, schoolId) {
  if (!teacherIds?.length) return;

  const count = await User.countDocuments({
    _id: { $in: teacherIds },
    schoolId,
    role: "teacher",
  });

  if (count !== teacherIds.length) {
    throw new ApiError(400, "One or more selected teachers are invalid");
  }
}

export async function createSubject(payload, schoolId) {
  const exists = await SubjectModel.findOne({
    schoolId,
    name: payload.name,
  });

  if (exists) {
    throw new ApiError(400, "Subject already exists for this school");
  }

  await validateClassIds(payload.classIds, schoolId);
  await validateTeacherIds(payload.teacherIds, schoolId);

  const data = await SubjectModel.create({
    schoolId,
    name: payload.name,
    code: payload.code || "",
    classIds: payload.classIds || [],
    teacherIds: payload.teacherIds || [],
    isActive: payload.isActive ?? true,
  });

  return data;
}

export async function listSubjects(schoolId) {
  return SubjectModel.find({ schoolId })
    .populate("classIds", "name level")
    .populate("teacherIds", "firstName lastName email")
    .sort({ createdAt: -1 });
}

export async function getSubjectById(id, schoolId) {
  const data = await SubjectModel.findOne({ _id: id, schoolId })
    .populate("classIds", "name level")
    .populate("teacherIds", "firstName lastName email");

  if (!data) {
    throw new ApiError(404, "Subject not found");
  }

  return data;
}

export async function updateSubject(id, payload, schoolId) {
  const data = await SubjectModel.findOne({ _id: id, schoolId });

  if (!data) {
    throw new ApiError(404, "Subject not found");
  }

  if (payload.name && payload.name !== data.name) {
    const exists = await Subject.findOne({
      schoolId,
      name: payload.name,
      _id: { $ne: id },
    });

    if (exists) {
      throw new ApiError(400, "Another subject with this name already exists");
    }
  }

  if (payload.classIds !== undefined) {
    await validateClassIds(payload.classIds, schoolId);
    data.classIds = payload.classIds;
  }

  if (payload.teacherIds !== undefined) {
    await validateTeacherIds(payload.teacherIds, schoolId);
    data.teacherIds = payload.teacherIds;
  }

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.code !== undefined) data.code = payload.code;
  if (payload.isActive !== undefined) data.isActive = payload.isActive;

  await data.save();
  return data;
}

export async function deleteSubject(id, schoolId) {
  const data = await SubjectModel.findOneAndDelete({ _id: id, schoolId });

  if (!data) {
    throw new ApiError(404, "Subject not found");
  }

  return data;
}