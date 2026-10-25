
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

// Teachers can read a scheme only for an assigned class.
// The controller verifies their class assignment.
router.get("/", asyncHandler(getResultSchemeController));

// Scheme configuration remains administrator-only.
router.use(authorize("school_admin"));

router.get("/all", asyncHandler(listResultSchemesController));
router.put("/", asyncHandler(saveResultSchemeController));

export default router;

