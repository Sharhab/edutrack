import { updateSchoolProfileSchema } from "./school-profile.validation.js";
import {
  deleteSchoolLogo,
  getSchoolProfile,
  updateSchoolProfile,
  uploadSchoolLogo,
} from "./school-profile.service.js";
import { ApiError } from "../../utils/apiError.js";

/* =========================================
   GET PROFILE
========================================= */
export async function updateSchoolProfileHandler(req, res) {
  const parsed = updateSchoolProfileSchema.parse(req.body);

  if (req.file) {
    parsed.logoUrl = `/uploads/logos/${req.file.filename}`;
  }

  const data = await updateSchoolProfile(
    parsed,
    req.user
  );

  res.json({
    success: true,
    message: "School profile updated successfully",
    data,
  });
}
/* =========================================
   UPLOAD LOGO
========================================= */
export async function uploadSchoolLogoHandler(req, res) {
  if (!req.file) {
    throw new ApiError(400, "Logo file is required");
  }

  const filePath = `/uploads/logos/${req.file.filename}`;

  const data = await uploadSchoolLogo(
    filePath,
    req.user
  );

  res.status(201).json({
    success: true,
    message: "School logo uploaded successfully",
    data,
  });
}

/* =========================================
   DELETE LOGO
========================================= */
export async function deleteSchoolLogoHandler(
  req,
  res
) {
  const data =
    await deleteSchoolLogo(
      req.user
    );

  res.json({
    success: true,
    message:
      "School logo deleted successfully",
    data,
  });
}