import express from "express";
import {
  createSchool,
  getSingleSchool,
  listSchools,
  toggleStatus,
  updateSchoolHandler,
} from "./school.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = express.Router();

router.use(protect);
router.use(authorize("super_admin"));

router.post("/", asyncHandler(createSchool));
router.get("/", asyncHandler(listSchools));
router.get("/:id", asyncHandler(getSingleSchool));
router.put("/:id", asyncHandler(updateSchoolHandler));
router.patch("/:id/toggle-status", asyncHandler(toggleStatus));

export default router;