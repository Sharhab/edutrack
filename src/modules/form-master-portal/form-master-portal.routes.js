import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getFormMasterOverviewHandler,
  getFormMasterClassStudentsHandler,
} from "./form-master-portal.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("teacher"));

router.get(
  "/overview",
  asyncHandler(getFormMasterOverviewHandler)
);

router.get(
  "/classes/:classId/students",
  asyncHandler(getFormMasterClassStudentsHandler)
);

export default router;
