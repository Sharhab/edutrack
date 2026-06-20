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

/*
=========================================
GET PROFILE
=========================================
*/
router.get(
  "/",
  asyncHandler(getSchoolProfileHandler)
);

/*
=========================================
UPDATE PROFILE
Supports text fields + optional logo upload
=========================================
*/
router.put(
  "/",
  uploadLogo.single("logo"),
  asyncHandler(updateSchoolProfileHandler)
);

/*
=========================================
UPLOAD ONLY LOGO
(optional separate endpoint)
=========================================
*/
router.post(
  "/logo",
  uploadLogo.single("logo"),
  asyncHandler(uploadSchoolLogoHandler)
);

/*
=========================================
DELETE LOGO
=========================================
*/
router.delete(
  "/logo",
  asyncHandler(deleteSchoolLogoHandler)
);

export default router;