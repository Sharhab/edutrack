import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  getGradingScaleHandler,
  saveGradingScaleHandler,
} from "./grading-scale.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));

router.get("/", asyncHandler(getGradingScaleHandler));
router.put("/", asyncHandler(saveGradingScaleHandler));

export default router;
