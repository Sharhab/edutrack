import {
  createStudentSchema,
  updateStudentSchema,
  bulkUpsertStudentSchema,
} from "./student.validation.js";
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  updateStudent,
   bulkUpsertStudents,
  generateMissingStudentLoginAccounts,
  resetStudentPassword,
} from "./student.service.js";
import { logSchoolAdminActivity } from "../school-monitoring/school-admin-activity.service.js";

export async function bulkUpsertStudentsHandler(req, res, next) {
  try {
    const schoolId = req.user.schoolId;
  const { students } = req.body;

console.log("========== BULK STUDENTS REQUEST ==========");
console.log("STUDENTS:", JSON.stringify(students, null, 2));
console.log("FIRST STUDENT CLASS ID:", students?.[0]?.classId);
console.log("==========================================");
    const parsed = bulkUpsertStudentSchema.parse(req.body);

    const result = await bulkUpsertStudents(
      parsed.students,
      schoolId
    );

    await logSchoolAdminActivity({
  user: req.user,
  action: "students_bulk_imported",
  module: "students",
  description: "Processed a bulk student import",
  entityType: "Student",
  metadata: {
    submittedCount: parsed.students.length,
  },
});
    return res.status(200).json({
      success: true,
      message: "Students bulk processed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
export async function generateStudentLoginAccountsHandler(req, res) {
  const data = await generateMissingStudentLoginAccounts(
    req.user.schoolId
  );

  return res.status(200).json({
    success: true,
    message: "Student login account generation completed",
    data,
  });
}
export async function createStudentHandler(req, res) {
  const parsed = createStudentSchema.parse(req.body);

  const data = await createStudent(parsed, req.user.schoolId);

  await logSchoolAdminActivity({
    user: req.user,
    action: "student_created",
    module: "students",
    description: "Enrolled a new student",
    entityId: data?._id,
    entityType: "Student",
    metadata: {
      admissionNumber: data?.admissionNumber || null,
    },
  });

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

export async function listStudentsByClassHandler(req, res) {
  const data = await listStudents(
    req.user.schoolId,
    {
      ...req.query,
      classId: req.params.classId,
    }
  );

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

  const data = await updateStudent(
    req.params.id,
    parsed,
    req.user.schoolId
  );

  await logSchoolAdminActivity({
    user: req.user,
    action: "student_updated",
    module: "students",
    description: "Updated a student record",
    entityId: data?._id || req.params.id,
    entityType: "Student",
  });

  res.json({
    success: true,
    message: "Student updated successfully",
    data,
  });
}


export async function deleteStudentHandler(req, res) {
  const data = await deleteStudent(
    req.params.id,
    req.user.schoolId
  );

  await logSchoolAdminActivity({
    user: req.user,
    action: "student_deleted",
    module: "students",
    description: "Deleted a student record",
    entityId: req.params.id,
    entityType: "Student",
  });

  res.json({
    success: true,
    message: "Student deleted successfully",
    data,
  });
}
export async function resetStudentPasswordHandler(
  req,
  res,
  next
) {
  try {
    const { temporaryPassword } = req.body;

    if (
      typeof temporaryPassword !== "string" ||
      temporaryPassword.length < 12 ||
      temporaryPassword.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Temporary password must be between 12 and 128 characters",
      });
    }

    const data = await resetStudentPassword(
      req.params.id,
      req.user.schoolId,
      temporaryPassword
    );

    return res.status(200).json({
      success: true,
      message: "Student password reset successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}


