import { createSchoolSchema, updateSchoolSchema } from "./school.validation.js";
import {
  createSchoolWithAdmin,
  getSchoolById,
  getSchools,
  toggleSchoolStatus,
  updateSchool,
} from "./school.service.js";

export async function createSchool(req, res) {
  const parsed = createSchoolSchema.parse(req.body);
  const data = await createSchoolWithAdmin(parsed);

  res.status(201).json({
    success: true,
    message: "School created successfully",
    data,
  });
}

export async function listSchools(req, res) {
  const data = await getSchools();

  res.json({
    success: true,
    message: "Schools fetched successfully",
    data,
  });
}

export async function getSingleSchool(req, res) {
  const data = await getSchoolById(req.params.id);

  res.json({
    success: true,
    message: "School fetched successfully",
    data,
  });
}

export async function updateSchoolHandler(req, res) {
  const parsed = updateSchoolSchema.parse(req.body);
  const data = await updateSchool(req.params.id, parsed);

  res.json({
    success: true,
    message: "School updated successfully",
    data,
  });
}

export async function toggleStatus(req, res) {
  const data = await toggleSchoolStatus(req.params.id);

  res.json({
    success: true,
    message: "School status updated successfully",
    data,
  });
}