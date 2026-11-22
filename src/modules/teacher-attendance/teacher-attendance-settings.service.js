
import TeacherAttendanceSettings from "./teacher-attendance-settings.model.js";
import { ApiError } from "../../utils/apiError.js";

const DEFAULT_SETTINGS = {
  geofenceRadiusMetres: 100,
  verificationMethod: "gps",
  reportingTime: "08:00",
  closingTime: "15:00",
  lateGraceMinutes: 15,
  clockInEnabled: true,
  clockOutRequired: true,
  timezone: "Africa/Lagos",
  workingDays: [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ],
};

function serializeSettings(settings) {
  return {
    _id: settings._id,
    location: settings.location,
    geofenceRadiusMetres: settings.geofenceRadiusMetres,
    verificationMethod: settings.verificationMethod,
    reportingTime: settings.reportingTime,
    closingTime: settings.closingTime,
    lateGraceMinutes: settings.lateGraceMinutes,
    clockInEnabled: settings.clockInEnabled,
    clockOutRequired: settings.clockOutRequired,
    timezone: settings.timezone,
    workingDays: settings.workingDays,
    updatedAt: settings.updatedAt,
  };
}

// GET SCHOOL ATTENDANCE SETTINGS
export async function getTeacherAttendanceSettings(user) {
  if (!user?.schoolId) {
    throw new ApiError(
      403,
      "User is not linked to a school"
    );
  }

  let settings = await TeacherAttendanceSettings.findOne({
    schoolId: user.schoolId,
  }).lean();

  // Return defaults without creating a database record.
  if (!settings) {
    return {
      ...DEFAULT_SETTINGS,
      location: {
        latitude: null,
        longitude: null,
        label: "",
      },
      configured: false,
    };
  }

  return {
    ...serializeSettings(settings),
    configured:
      settings.location?.latitude !== null &&
      settings.location?.latitude !== undefined &&
      settings.location?.longitude !== null &&
      settings.location?.longitude !== undefined,
  };
}

// UPDATE SCHOOL ATTENDANCE SETTINGS
export async function updateTeacherAttendanceSettings(
  payload,
  user
) {
  if (user?.role !== "school_admin") {
    throw new ApiError(
      403,
      "Only school administrators can update attendance settings"
    );
  }

  if (!user.schoolId) {
    throw new ApiError(
      403,
      "User is not linked to a school"
    );
  }

  const update = {};

  const allowedFields = [
    "geofenceRadiusMetres",
    "reportingTime",
    "closingTime",
    "lateGraceMinutes",
    "clockInEnabled",
    "clockOutRequired",
    "timezone",
    "workingDays",
  ];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      update[field] = payload[field];
    }
  }

  if (payload.location !== undefined) {
  update.location = {
    latitude: payload.location.latitude,
    longitude: payload.location.longitude,
    label: payload.location.label || "",
  };
}

  if (Object.keys(update).length === 0) {
    throw new ApiError(
      400,
      "No attendance settings were provided"
    );
  }

  update.updatedBy = user._id;

  const settings = await TeacherAttendanceSettings.findOneAndUpdate(
    { schoolId: user.schoolId },
    {
      $set: update,
      $setOnInsert: {
        schoolId: user.schoolId,
        ...DEFAULT_SETTINGS,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return {
    ...serializeSettings(settings),
    configured:
      settings.location?.latitude !== null &&
      settings.location?.latitude !== undefined &&
      settings.location?.longitude !== null &&
      settings.location?.longitude !== undefined,
  };
}
