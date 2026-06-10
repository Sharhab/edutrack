import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadLogo } from "../../utils/upload.js";
import {
  deleteSchoolLogoHandler,
  getSchoolProfileHandler,
  updateSchoolProfileHandler,
  uploadSchoolLogoHandler,
} from "./school-profile.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));

router.get("/", asyncHandler(getSchoolProfileHandler));
router.put("/", asyncHandler(updateSchoolProfileHandler));
router.post("/logo", uploadLogo.single("logo"), asyncHandler(uploadSchoolLogoHandler));
router.delete("/logo", asyncHandler(deleteSchoolLogoHandler));

export default router;