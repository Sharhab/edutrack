

import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getResultSchemeController,
  listResultSchemesController,
  saveResultSchemeController,
} from "./result-scheme.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));

router.get("/all", asyncHandler(listResultSchemesController));
router.get("/", asyncHandler(getResultSchemeController));
router.put("/", asyncHandler(saveResultSchemeController));

export default router;
