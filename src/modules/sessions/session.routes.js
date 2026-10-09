
import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createSessionHandler,
  getSessionHandler,
  listSessionsHandler,
  setCurrentSessionHandler,
} from "./session.controller.js";

const router = express.Router();

/**
 * =========================================
 * AUTHENTICATION
 * All session routes require a valid token.
 * =========================================
 */
router.use(protect);

/**
 * =========================================
 * LIST SESSIONS
 * School admins, teachers, and parents can
 * view sessions for their school.
 * =========================================
 */
router.get(
  "/",
  authorize("school_admin", "teacher", "parent"),
  asyncHandler(listSessionsHandler)
);

/**
 * =========================================
 * GET SINGLE SESSION
 * School admins, teachers, and parents can
 * view a specific session.
 * =========================================
 */
router.get(
  "/:id",
  authorize("school_admin", "teacher", "parent"),
  asyncHandler(getSessionHandler)
);

/**
 * =========================================
 * CREATE SESSION
 * School admins only.
 * =========================================
 */
router.post(
  "/",
  authorize("school_admin"),
  asyncHandler(createSessionHandler)
);

/**
 * =========================================
 * SET CURRENT SESSION
 * School admins only.
 * =========================================
 */
router.patch(
  "/:id/set-current",
  authorize("school_admin"),
  asyncHandler(setCurrentSessionHandler)
);

export default router;
