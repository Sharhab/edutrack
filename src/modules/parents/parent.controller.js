import { createParentSchema, updateParentSchema } from "./parent.validation.js";

import {
  createParent,
  deleteParent,
  getParentById,
  listParents,
  updateParent,
  bulkCreateParents,
} from "./parent.service.js";

export async function createParentHandler(req, res) {
  const parsed = createParentSchema.parse(req.body);
  const data = await createParent(parsed, req.user.schoolId);

  res.status(201).json({
    success: true,
    message: "Parent created successfully",
    data,
  });
}

export async function listParentsHandler(req, res) {
  const data = await listParents(req.user.schoolId);

  res.json({
    success: true,
    message: "Parents fetched successfully",
    data,
  });
}

export async function getParentHandler(req, res) {
  const data = await getParentById(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Parent fetched successfully",
    data,
  });
}

export async function updateParentHandler(req, res) {
  const parsed = updateParentSchema.parse(req.body);
  const data = await updateParent(req.params.id, parsed, req.user.schoolId);

  res.json({
    success: true,
    message: "Parent updated successfully",
    data,
  });
}

export async function deleteParentHandler(req, res) {
  const data = await deleteParent(req.params.id, req.user.schoolId);

  res.json({
    success: true,
    message: "Parent deleted successfully",
    data,
  });
}

export async function bulkParentsController(req, res) {
  try {
    const schoolId = req.user.schoolId;

    if (!req.body.rows || !Array.isArray(req.body.rows)) {
      return res.status(400).json({
        success: false,
        message: "Rows must be an array",
      });
    }

    const result = await bulkCreateParents(req.body.rows, schoolId);

    res.status(200).json({
      success: true,
      message: "Bulk operation completed",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Bulk operation failed",
    });
  }
}