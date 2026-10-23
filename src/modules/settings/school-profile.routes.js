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
  getSchoolBrandingHandler,
  uploadPrincipalSignatureHandler,
uploadSchoolStampHandler,
} from "./school-profile.controller.js";

const router = express.Router();

router.use(protect);

// Branding is read-only and available to school users.
router.get(
  "/branding",
  authorize("school_admin", "teacher", "parent"),
  asyncHandler(getSchoolBrandingHandler)
);

// Keep all other profile routes restricted to school admins.
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
UPLOAD PRINCIPAL SIGNATURE
=========================================
*/
router.post(
  "/principal-signature",
  uploadLogo.single("image"),
  asyncHandler(uploadPrincipalSignatureHandler)
);

/*
=========================================
UPLOAD SCHOOL STAMP
=========================================
*/
router.post(
  "/stamp",
  uploadLogo.single("image"),
  asyncHandler(uploadSchoolStampHandler)
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
