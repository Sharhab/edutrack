
import Teacher from "../teachers/teacher.model.js";
import TeacherAttendanceSettings from "./teacher-attendance-settings.model.js";
import TeacherAttendance from "./teacher-attendance.model.js";

const ABSENCE_GRACE_MINUTES = 30;

function getSchoolLocalTime(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    weekday: values.weekday.toLowerCase(),
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function runTeacherAttendanceAbsenceJob() {
  const now = new Date();

  const summary = {
    schoolsChecked: 0,
    schoolsEligible: 0,
    teachersChecked: 0,
    absencesCreated: 0,
    existingRecordsSkipped: 0,
    errors: 0,
  };

  const settingsList = await TeacherAttendanceSettings.find({
    clockInEnabled: true,
  }).lean();

  for (const settings of settingsList) {
    summary.schoolsChecked += 1;

    try {
      const timezone = settings.timezone || "Africa/Lagos";
      const local = getSchoolLocalTime(now, timezone);

      if (!settings.workingDays?.includes(local.weekday)) {
        continue;
      }

      const closingMinutes = timeToMinutes(
        settings.closingTime || "15:00"
      );

      const cutoffMinutes =
        closingMinutes + ABSENCE_GRACE_MINUTES;

      if (local.minutes < cutoffMinutes) {
        continue;
      }

      summary.schoolsEligible += 1;

      const teachers = await Teacher.find({
        schoolId: settings.schoolId,
        isActive: true,
        status: "active",
      })
        .select("_id")
        .lean();

      summary.teachersChecked += teachers.length;

      for (const teacher of teachers) {
        try {
          // Upsert only inserts when no record exists.
          // Existing GPS and admin records are never modified.
          const result = await TeacherAttendance.updateOne(
            {
              schoolId: settings.schoolId,
              teacherId: teacher._id,
              date: local.date,
            },
            {
              $setOnInsert: {
                schoolId: settings.schoolId,
                teacherId: teacher._id,
                date: local.date,
                status: "absent",
                source: "system",
                notes:
                  "Automatically marked absent after school closing time and 30-minute grace period.",
              },
            },
            {
              upsert: true,
              runValidators: true,
              setDefaultsOnInsert: true,
            }
          );

          if (result.upsertedCount > 0) {
            summary.absencesCreated += 1;
          } else {
            summary.existingRecordsSkipped += 1;
          }
        } catch (error) {
          // Concurrent job instances may attempt the same insert.
          // The unique index allows only one record per teacher/day.
          if (error.code === 11000) {
            summary.existingRecordsSkipped += 1;
            continue;
          }

          summary.errors += 1;

          console.error(
            `[STAFF ATTENDANCE ABSENCE] Teacher ${teacher._id} failed:`,
            error.message
          );
        }
      }
    } catch (error) {
      summary.errors += 1;

      console.error(
        `[STAFF ATTENDANCE ABSENCE] School ${settings.schoolId} failed:`,
        error.message
      );
    }
  }

  console.log("[STAFF ATTENDANCE ABSENCE] Job completed", {
    ...summary,
    completedAt: now.toISOString(),
  });

  return summary;
}
