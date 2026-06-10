import { createStudentSchema, updateStudentSchema } from "./student.validation.js";
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  updateStudent,
   bulkUpsertStudents,
} from "./student.service.js";


export async function bulkUpsertStudentsHandler(req, res, next) {
  try {
    const schoolId = req.user.schoolId;
    const { students } = req.body;

    const result = await bulkUpsertStudents(students, schoolId);

    return res.status(200).json({
      success: true,
      message: "Students bulk processed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function createStudentHandler(req, res) {
  const parsed = createStudentSchema.parse(req.body);
  const data = await createStudent(parsed, req.user.schoolId);

  res.status(201).json({
    success: true,
    message: "Student created successfully",
    data,
  });
}

export async function listStudentsHandler(req, res) {
  const data = await listStudents(req.user.schoolId, req.query);

  res.json({
    success: true,
    message: "Students fetched successfully",
    data,
  });
}
export async function getStudentHandler(req, res) {
  const data = await getStudentById(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Student fetched successfully",
    data,
  });
}

export async function updateStudentHandler(req, res) {
  const parsed = updateStudentSchema.parse(req.body);
  const data = await updateStudent(req.params.id, parsed, req.user.schoolId);

  res.json({
    success: true,
    message: "Student updated successfully",
    data,
  });
}

export async function deleteStudentHandler(req, res) {
  const data = await deleteStudent(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Student deleted successfully",
    data,
  });
}