
import {
  createClassSchema,
  updateClassSchema,
  bulkUpsertClassSchema,
} from "./class.validation.js";
import {
  createClass,
  deleteClass,
  getClassById,
  listClasses,
  updateClass,
  bulkUpsertClasses,
} from "./class.service.js";
import { logSchoolAdminActivity } from "../school-monitoring/school-admin-activity.service.js";
export async function createClassHandler(req, res) {

  
  const parsed = createClassSchema.parse(req.body);
  const data = await createClass(parsed, req.user.schoolId);
  await logSchoolAdminActivity({
  user: req.user,
  action: "class_created",
  module: "classes",
  description: "Created a class",
  entityId: data?._id,
  entityType: "Class",
});
  res.status(201).json({
    success: true,
    message: "Class created successfully",
    data,
  });
}

export async function listClassesHandler(req, res) {
  const data = await listClasses(req.user.schoolId);

  res.json({
    success: true,
    message: "Classes fetched successfully",
    data,
  });
}

export async function getClassHandler(req, res) {
  const data = await getClassById(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Class fetched successfully",
    data,
  });
}

export async function updateClassHandler(req, res) {
  const parsed = updateClassSchema.parse(req.body);
  const data = await updateClass(req.params.id, parsed, req.user.schoolId);
 await logSchoolAdminActivity({
  user: req.user,
  action: "class_updated",
  module: "classes",
  description: "Updated a class",
  entityId: data?._id || req.params.id,
  entityType: "Class",
});
  res.json({
    success: true,
    message: "Class updated successfully",
    data,
  });
}

export async function deleteClassHandler(req, res) {
  const data = await deleteClass(req.params.id, req.user.schoolId);

  await logSchoolAdminActivity({
  user: req.user,
  action: "class_deleted",
  module: "classes",
  description: "Deleted a class",
  entityId: req.params.id,
  entityType: "Class",
});
  res.json({
    success: true,
    message: "Class deleted successfully",
    data,
  });
}

export async function bulkUpsertClassesHandler(req, res, next) {
  try {
    const parsed = bulkUpsertClassSchema.parse(req.body);
    const schoolId = req.user.schoolId;

    const result = await bulkUpsertClasses(
      parsed.classes,
      schoolId
    );
   
    await logSchoolAdminActivity({
  user: req.user,
  action: "classes_bulk_imported",
  module: "classes",
  description: "Processed a bulk class import",
  entityType: "Class",
  metadata: {
    submittedCount: parsed.classes.length,
  },
});
    return res.status(200).json({
      success: true,
      message: "Classes processed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
