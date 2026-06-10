import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { tenantScope } from "../../middlewares/tenantScope.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createParentHandler,
  deleteParentHandler,
  getParentHandler,
  listParentsHandler,
  updateParentHandler,
  bulkParentsController,
} from "./parent.controller.js";

const router = express.Router();

/* =========================
   GLOBAL MIDDLEWARE STACK
========================= */
// Auth
router.use(protect);

// Role restriction
router.use(authorize("school_admin", "super_admin"));

// Tenant isolation
router.use(tenantScope);

/* =========================
   PARENT ROUTES
========================= */

/**
 * CREATE SINGLE PARENT
 */
router.post("/", asyncHandler(createParentHandler));

/**
 * BULK CREATE PARENTS (ENTERPRISE)
 */
router.post("/bulk", asyncHandler(bulkParentsController));

/**
 * LIST PARENTS
 */
router.get("/", asyncHandler(listParentsHandler));

/**
 * GET SINGLE PARENT
 */
router.get("/:id", asyncHandler(getParentHandler));

/**
 * UPDATE PARENT
 */
router.put("/:id", asyncHandler(updateParentHandler));

/**
 * DELETE PARENT
 */
router.delete("/:id", asyncHandler(deleteParentHandler));

/* =========================
   EXPORT ROUTER
========================= */
export default router;