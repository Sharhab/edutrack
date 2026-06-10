import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createClassHandler,
  deleteClassHandler,
  getClassHandler,
  listClassesHandler,
  updateClassHandler,
  bulkUpsertClassesHandler,
} from "./class.controller.js";

const router = express.Router();

/**
 * GLOBAL AUTH GUARDS
 */
router.use(protect);
router.use(authorize("school_admin"));

/**
 * =========================
 * BULK OPERATIONS (MUST COME FIRST)
 * =========================
 */
router.post(
  "/bulk-upsert",
  asyncHandler(bulkUpsertClassesHandler)
);

/**
 * =========================
 * SINGLE CLASS OPERATIONS
 * =========================
 */
router.post(
  "/",
  asyncHandler(createClassHandler)
);

router.get(
  "/",
  asyncHandler(listClassesHandler)
);

/**
 * IMPORTANT: keep static routes ABOVE dynamic ones
 */
router.get(
  "/:id",
  asyncHandler(getClassHandler)
);

router.put(
  "/:id",
  asyncHandler(updateClassHandler)
);

router.delete(
  "/:id",
  asyncHandler(deleteClassHandler)
);

export default router;