
import mongoose from "mongoose";

import Teacher from "../teachers/teacher.model.js";
import TeacherAttendanceSettings from "./teacher-attendance-settings.model.js";
import TeacherAttendance from "./teacher-attendance.model.js";
import { ApiError } from "../../utils/apiError.js";

const MAX_GPS_ACCURACY_METRES = 100;

// ---------------- TIME HELPERS ----------------

function getZonedDateParts(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function getWeekday(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .toLowerCase();
}

// ---------------- GPS HELPERS ----------------

function calculateDistanceMetres(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    earthRadius *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

function verifyLocation(location, settings) {
  if (!settings.location?.latitude && settings.location?.latitude !== 0) {
    throw new ApiError(
      400,
      "School GPS location has not been configured"
    );
  }

  if (
    !settings.location?.longitude &&
    settings.location?.longitude !== 0
  ) {
    throw new ApiError(
      400,
      "School GPS location has not been configured"
    );
  }

  const accuracy = location.accuracyMetres;

  if (
    typeof accuracy === "number" &&
    accuracy > MAX_GPS_ACCURACY_METRES
  ) {
    throw new ApiError(
      400,
      "GPS accuracy is too low. Move to an open area and try again"
    );
  }

  const distance = calculateDistanceMetres(
    settings.location.latitude,
    settings.location.longitude,
    location.latitude,
    location.longitude
  );

  if (distance > settings.geofenceRadiusMetres) {
    throw new ApiError(
      403,
      `You are outside the school attendance area. Distance: ${Math.round(
        distance
      )} metres`
    );
  }

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracyMetres: accuracy ?? null,
    distanceFromSchoolMetres: Math.round(distance),
  };
}

// ---------------- ACCESS HELPERS ----------------

async function getActiveTeacher(user) {
  if (!user?.schoolId || !user?._id) {
    throw new ApiError(401, "Authentication required");
  }

  const teacher = await Teacher.findOne({
    userId: user._id,
    schoolId: user.schoolId,
    isActive: true,
    status: "active",
  });

  if (!teacher) {
    throw new ApiError(
      403,
      "Your active teacher profile was not found"
    );
  }

  return teacher;
}

async function getSettings(schoolId) {
  const settings = await TeacherAttendanceSettings.findOne({
    schoolId,
  });

  if (!settings) {
    throw new ApiError(
      400,
      "Teacher attendance settings have not been configured"
    );
  }

  return settings;
}

function ensureWorkingDay(date, settings) {
  const weekday = getWeekday(date);

  if (!settings.workingDays.includes(weekday)) {
    throw new ApiError(
      400,
      "Teacher attendance is not enabled for today"
    );
  }
}

function calculateLateMinutes(nowMinutes, settings) {
  const reportingMinutes = timeToMinutes(settings.reportingTime);
  const allowedMinutes =
    reportingMinutes + settings.lateGraceMinutes;

  return Math.max(0, nowMinutes - allowedMinutes);
}

// ---------------- CLOCK IN ----------------

export async function clockInTeacher(payload, user) {
  const teacher = await getActiveTeacher(user);
  const settings = await getSettings(user.schoolId);

  if (!settings.clockInEnabled) {
    throw new ApiError(403, "Teacher clock-in is currently disabled");
  }

  if (!payload?.location) {
    throw new ApiError(400, "GPS location is required");
  }

  const now = new Date();
  const localTime = getZonedDateParts(now, settings.timezone);

  ensureWorkingDay(localTime.date, settings);

  const verifiedLocation = verifyLocation(
    payload.location,
    settings
  );

  const lateMinutes = calculateLateMinutes(
    localTime.minutes,
    settings
  );

  const status = lateMinutes > 0 ? "late" : "present";

  const filter = {
    schoolId: user.schoolId,
    teacherId: teacher._id,
    date: localTime.date,
    clockInAt: null,
  };

  const update = {
    $set: {
      status,
      clockInAt: now,
      clockInLocation: verifiedLocation,
      lateMinutes,
      source: "gps",
    },
    $setOnInsert: {
      schoolId: user.schoolId,
      teacherId: teacher._id,
      date: localTime.date,
    },
  };

  try {
    // First try to update an existing record that has not
    // already been clocked in.
    const existing = await TeacherAttendance.findOneAndUpdate(
      filter,
      update,
      {
        new: true,
        runValidators: true,
      }
    );

    if (existing) {
      return existing;
    }

    // No record exists yet. Create one. The unique database
    // index ensures simultaneous requests cannot create two.
    return await TeacherAttendance.create({
      schoolId: user.schoolId,
      teacherId: teacher._id,
      date: localTime.date,
      status,
      clockInAt: now,
      clockInLocation: verifiedLocation,
      lateMinutes,
      source: "gps",
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(
        409,
        "You have already clocked in today"
      );
    }

    throw error;
  }
}


// ---------------- CLOCK OUT ----------------

export async function clockOutTeacher(payload, user) {
  const teacher = await getActiveTeacher(user);
  const settings = await getSettings(user.schoolId);

  if (!payload?.location) {
    throw new ApiError(400, "GPS location is required");
  }

  const now = new Date();
  const localTime = getZonedDateParts(now, settings.timezone);

  const verifiedLocation = verifyLocation(
    payload.location,
    settings
  );

  const attendance = await TeacherAttendance.findOne({
    schoolId: user.schoolId,
    teacherId: teacher._id,
    date: localTime.date,
  });

  if (!attendance?.clockInAt) {
    throw new ApiError(
      400,
      "You must clock in before clocking out"
    );
  }

  if (attendance.clockOutAt) {
    throw new ApiError(
      409,
      "You have already clocked out today"
    );
  }

  if (now < attendance.clockInAt) {
    throw new ApiError(
      400,
      "Clock-out time cannot be before clock-in time"
    );
  }

  const totalMinutes = Math.floor(
    (now.getTime() - attendance.clockInAt.getTime()) / 60000
  );

  attendance.clockOutAt = now;
  attendance.clockOutLocation = verifiedLocation;
  attendance.totalMinutes = totalMinutes;

  await attendance.save();

  return attendance;
}

// ---------------- MY ATTENDANCE ----------------

export async function getMyTeacherAttendance(query, user) {
  const teacher = await getActiveTeacher(user);

  const filter = {
    schoolId: user.schoolId,
    teacherId: teacher._id,
  };

  if (query.startDate || query.endDate) {
    filter.date = {};

    if (query.startDate) {
      filter.date.$gte = query.startDate;
    }

    if (query.endDate) {
      filter.date.$lte = query.endDate;
    }
  } else if (query.date) {
    filter.date = query.date;
  }

  return TeacherAttendance.find(filter)
    .sort({ date: -1 })
    .limit(query.limit || 30);
}

// ---------------- ADMIN LIST ----------------

export async function listTeacherAttendance(query, user) {
  if (user.role !== "school_admin") {
    throw new ApiError(
      403,
      "Only school administrators can view all teacher attendance"
    );
  }

  const filter = { schoolId: user.schoolId };

  if (query.teacherId) {
    if (!mongoose.isValidObjectId(query.teacherId)) {
      throw new ApiError(400, "Invalid teacher ID");
    }

    filter.teacherId = query.teacherId;
  }

  if (query.date) {
    filter.date = query.date;
  } else if (query.startDate || query.endDate) {
    filter.date = {};

    if (query.startDate) {
      filter.date.$gte = query.startDate;
    }

    if (query.endDate) {
      filter.date.$lte = query.endDate;
    }
  }

  if (query.status) {
    filter.status = query.status;
  }

  const page = query.page || 1;
  const limit = query.limit || 20;

  const [records, total] = await Promise.all([
    TeacherAttendance.find(filter)
      .populate("teacherId", "employeeId userId")
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    TeacherAttendance.countDocuments(filter),
  ]);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}
