import {
  createSubjectSchema,
  updateSubjectSchema,
} from "./subject.validation.js";
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  listSubjects,
  updateSubject,
} from "./subject.service.js";

export async function createSubjectHandler(req, res) {
  const parsed = createSubjectSchema.parse(req.body);
  const data = await createSubject(parsed, req.user.schoolId);

  res.status(201).json({
    success: true,
    message: "Subject created successfully",
    data,
  });
}

export async function listSubjectsHandler(req, res) {
  const data = await listSubjects(req.user.schoolId);

  res.json({
    success: true,
    message: "Subjects fetched successfully",
    data,
  });
}

export async function getSubjectHandler(req, res) {
  const data = await getSubjectById(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Subject fetched successfully",
    data,
  });
}

export async function updateSubjectHandler(req, res) {
  const parsed = updateSubjectSchema.parse(req.body);
  const data = await updateSubject(req.params.id, parsed, req.user.schoolId);

  res.json({
    success: true,
    message: "Subject updated successfully",
    data,
  });
}

export async function deleteSubjectHandler(req, res) {
  const data = await deleteSubject(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Subject deleted successfully",
    data,
  });
}