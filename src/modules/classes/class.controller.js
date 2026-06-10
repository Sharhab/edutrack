import { createClassSchema, updateClassSchema } from "./class.validation.js";
import {
  createClass,
  deleteClass,
  getClassById,
  listClasses,
  updateClass,
  bulkUpsertClasses,
} from "./class.service.js";

export async function createClassHandler(req, res) {

  console.log(
  "LIST CLASSES SCHOOL:",
  req.user.schoolId
);
  const parsed = createClassSchema.parse(req.body);
  const data = await createClass(parsed, req.user.schoolId);

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

  res.json({
    success: true,
    message: "Class updated successfully",
    data,
  });
}

export async function deleteClassHandler(req, res) {
  const data = await deleteClass(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Class deleted successfully",
    data,
  });
}

export async function bulkUpsertClassesHandler(
  req,
  res,
  next
) {
  try {
    const schoolId =
      req.user.schoolId;

    const { classes } = req.body;

    const result =
      await bulkUpsertClasses(
        classes,
        schoolId
      );

    return res.status(200).json({
      success: true,
      message:
        "Classes processed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}