
import cron from "node-cron";
import { randomUUID } from "node:crypto";

import TeacherAttendanceJobLock from "./teacher-attendance-job-lock.model.js";
import { runTeacherAttendanceAbsenceJob } from "./teacher-attendance-absence.job.js";

const LOCK_ID = "teacher-attendance-absence";
const LOCK_DURATION_MS = 30 * 60 * 1000;

async function acquireJobLock(owner) {
  const now = new Date();

  try {
    const lock = await TeacherAttendanceJobLock.findOneAndUpdate(
      {
        _id: LOCK_ID,
        $or: [
          { expiresAt: { $lte: now } },
          { owner },
        ],
      },
      {
        $set: {
          owner,
          expiresAt: new Date(now.getTime() + LOCK_DURATION_MS),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return lock?.owner === owner;
  } catch (error) {
    // Another instance owns the lock. Its existing _id prevents
    // this instance from inserting a second lock document.
    if (error.code === 11000) {
      return false;
    }

    throw error;
  }
}

async function releaseJobLock(owner) {
  await TeacherAttendanceJobLock.deleteOne({
    _id: LOCK_ID,
    owner,
  });
}

async function executeAbsenceJob() {
  const owner = randomUUID();
  const acquired = await acquireJobLock(owner);

  if (!acquired) {
    console.log(
      "[STAFF ATTENDANCE ABSENCE] Skipped: another server instance owns the job lock."
    );
    return;
  }

  try {
    await runTeacherAttendanceAbsenceJob();
  } catch (error) {
    console.error(
      "[STAFF ATTENDANCE ABSENCE] Job execution failed:",
      error
    );
  } finally {
    try {
      await releaseJobLock(owner);
    } catch (error) {
      console.error(
        "[STAFF ATTENDANCE ABSENCE] Failed to release job lock:",
        error
      );
    }
  }
}

export function startTeacherAttendanceAbsenceScheduler() {
  cron.schedule("*/5 * * * *", () => {
    executeAbsenceJob().catch((error) => {
      console.error(
        "[STAFF ATTENDANCE ABSENCE] Scheduler error:",
        error
      );
    });
  });

  console.log(
    "[STAFF ATTENDANCE ABSENCE] Scheduler started (every 5 minutes)"
  );
}
