import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  listFormMasterAssignmentsHandler,
  createFormMasterAssignmentHandler,
  reassignFormMasterHandler,
} from "./form-master-assignment.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));

router.get(
  "/",
  asyncHandler(listFormMasterAssignmentsHandler)
);

router.post(
  "/",
  asyncHandler(createFormMasterAssignmentHandler)
);

router.patch(
  "/:id/reassign",
  asyncHandler(reassignFormMasterHandler)
);

export default router;
