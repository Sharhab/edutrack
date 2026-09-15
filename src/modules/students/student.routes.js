import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createStudentHandler,
  deleteStudentHandler,
  getStudentHandler,
  listStudentsHandler,
  updateStudentHandler,
  listStudentsByClassHandler,
  bulkUpsertStudentsHandler,
} from "./student.controller.js";

import {
  previewStudentCSVHandler,
  importStudentCSVHandler,
} from "./student.csv.controller.js";

import { uploadCSV } from "./csv.upload.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));

/**
 * ==========================================
 * CSV IMPORT
 * ==========================================
 */

router.post(
  "/import/preview",
  uploadCSV.single("file"),
  asyncHandler(previewStudentCSVHandler)
);

router.post(
  "/import/execute",
  asyncHandler(importStudentCSVHandler)
);

/**
 * ==========================================
 * BULK UPSERT JSON
 * ==========================================
 */

router.post(
  "/bulk-upsert",
  asyncHandler(bulkUpsertStudentsHandler)
);

/**
 * ==========================================
 * NORMAL CRUD
 * ==========================================
 */

router.post(
  "/",
  asyncHandler(createStudentHandler)
);

router.get(
  "/",
  asyncHandler(listStudentsHandler)
);

/**
 * GET STUDENTS BY CLASS
 *
 * Supports:
 * GET /api/students/class/:classId
 *
 * We reuse listStudentsHandler by converting
 * the path parameter into the query expected
 * by listStudents().
 */
router.get(
  "/class/:classId",
  asyncHandler(async (req, res) => {
    const data = await listStudentsHandler(
      {
        ...req,
        query: {
          ...req.query,
          classId: req.params.classId,
        },
      },
      res
    );

    return data;
  })
);

/**
 * GET ONE STUDENT
 *
 * IMPORTANT:
 * This must remain AFTER /class/:classId
 * so "class" is not interpreted as a student ID.
 */
router.get(
  "/:id",
  asyncHandler(getStudentHandler)
);

router.put(
  "/:id",
  asyncHandler(updateStudentHandler)
);

router.delete(
  "/:id",
  asyncHandler(deleteStudentHandler)
);

export default router;
