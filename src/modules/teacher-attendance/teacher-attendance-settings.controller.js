
import {
  getTeacherAttendanceSettings,
  updateTeacherAttendanceSettings,
} from "./teacher-attendance-settings.service.js";

import {
  updateTeacherAttendanceSettingsSchema,
} from "./teacher-attendance.validation.js";

// GET SETTINGS
export async function getTeacherAttendanceSettingsHandler(
  req,
  res
) {
  const data = await getTeacherAttendanceSettings(req.user);

  res.json({
    success: true,
    message: "Teacher attendance settings fetched successfully",
    data,
  });
}

// UPDATE SETTINGS
export async function updateTeacherAttendanceSettingsHandler(
  req,
  res
) {
  const parsed =
    updateTeacherAttendanceSettingsSchema.parse(req.body);

  const data = await updateTeacherAttendanceSettings(
    parsed,
    req.user
  );

  res.json({
    success: true,
    message: "Teacher attendance settings updated successfully",
    data,
  });
}
