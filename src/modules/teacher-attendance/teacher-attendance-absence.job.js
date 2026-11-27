
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

/**
 * Marks active teachers absent after their school's closing time
 * plus the configured 30-minute grace period.
 *
 * Existing attendance records are never overwritten.
 * The unique schoolId + teacherId + date index prevents duplicates
 * when multiple backend instances run this job concurrently.
 */
export async function runTeacherAttendanceAbsenceJob() {
  const now = new Date();

  const summary = {
    schoolsChecked: 0,
    schoolsEligible: 0,
    teachersChecked: 0,
    absencesCreated: 0,
    duplicateRecordsSkipped: 0,
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

      // Do not process non-working days.
      if (!settings.workingDays?.includes(local.weekday)) {
        continue;
      }

      const closingMinutes = timeToMinutes(
        settings.closingTime || "15:00"
      );

      const absenceCutoff =
        closingMinutes + ABSENCE_GRACE_MINUTES;

      // Wait until closing time plus 30 minutes.
      if (local.minutes < absenceCutoff) {
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

      if (!teachers.length) {
        continue;
      }

      // Insert only when no attendance record exists.
      // Never update or overwrite GPS or admin records.
      const records = teachers.map((teacher) => ({
        schoolId: settings.schoolId,
        teacherId: teacher._id,
        date: local.date,
        status: "absent",
        source: "admin",
        notes: "Automatically marked absent after school closing time.",
      }));

      try {
        const inserted = await TeacherAttendance.insertMany(
          records,
          { ordered: false }
        );

        summary.absencesCreated += inserted.length;
      } catch (error) {
        // Bulk insert may partially succeed when records already
        // exist. The unique index protects existing attendance.
        if (error.code === 11000 || error.writeErrors?.length) {
          const insertedCount =
            error.insertedDocs?.length ??
            error.result?.insertedCount ??
            0;

          summary.absencesCreated += insertedCount;
          summary.duplicateRecordsSkipped +=
            Math.max(0, records.length - insertedCount);

          continue;
        }

        throw error;
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
