
import cron from "node-cron";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { School } from "../schools/school.model.js";

/**
 * =========================================
 * DATE RANGE HELPERS
 * =========================================
 */

/**
 * Academic end dates are inclusive.
 *
 * Database Date values may represent YYYY-MM-DD
 * as midnight. Treat midnight end dates as the
 * end of that calendar day, not its beginning.
 */
function getDateRange(date, inclusiveEnd = false) {
  if (!date) return null;

  const start = new Date(date);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);

  if (inclusiveEnd) {
    const isDateOnlyString =
      typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date);

    const isMidnight =
      end.getUTCHours() === 0 &&
      end.getUTCMinutes() === 0 &&
      end.getUTCSeconds() === 0 &&
      end.getUTCMilliseconds() === 0;

    if (isDateOnlyString || isMidnight) {
      end.setUTCHours(23, 59, 59, 999);
    }
  }

  return { start, end };
}

function isWithinDateRange(startDate, endDate, now) {
  const start = getDateRange(startDate);
  const end = getDateRange(endDate, true);

  if (!start || !end) {
    return false;
  }

  return start.start <= now && end.end >= now;
}

/**
 * =========================================
 * ACADEMIC ROLLOVER
 * =========================================
 *
 * Rules:
 * 1. Only one session may be automatically current.
 * 2. A current term must belong to that session.
 * 3. Overlapping date ranges are ambiguous, so do not
 *    change current flags for that school on that run.
 * 4. Terms without dates retain manual selection.
 * 5. School.currentSession/currentTerm mirror the
 *    selected Session and Term records.
 */
export async function runAcademicRollover() {
  const now = new Date();

  // Only sessions with both dates configured can
  // be automatically activated.
  const sessions = await Session.find({
    startDate: { $ne: null },
    endDate: { $ne: null },
  }).sort({ startDate: 1 });

  const sessionsBySchool = new Map();

  for (const session of sessions) {
    const schoolId = String(session.schoolId);

    if (!sessionsBySchool.has(schoolId)) {
      sessionsBySchool.set(schoolId, []);
    }

    sessionsBySchool.get(schoolId).push(session);
  }

  for (const [schoolId, schoolSessions] of sessionsBySchool) {
    try {
      /**
       * Find the active session before changing flags.
       */
      const activeSessions = schoolSessions.filter((session) =>
        isWithinDateRange(
          session.startDate,
          session.endDate,
          now
        )
      );

      // No active session or overlapping sessions:
      // preserve the existing academic settings.
      if (activeSessions.length !== 1) {
        if (activeSessions.length > 1) {
          console.warn(
            `[ACADEMIC ROLLOVER] Overlapping session dates for school ${schoolId}. Current settings were preserved.`
          );
        }

        continue;
      }

      const activeSession = activeSessions[0];

      /**
       * Resolve the term before changing any flags.
       */
      const sessionTerms = await Term.find({
        schoolId,
        sessionId: activeSession._id,
      }).sort({
        order: 1,
        startDate: 1,
        createdAt: 1,
      });

      const datedTerms = sessionTerms.filter(
        (term) => term.startDate && term.endDate
      );

      let activeTerm = null;

      if (datedTerms.length > 0) {
        const activeTerms = datedTerms.filter((term) =>
          isWithinDateRange(
            term.startDate,
            term.endDate,
            now
          )
        );

        // Do not update any flags when term dates overlap.
        if (activeTerms.length > 1) {
          console.warn(
            `[ACADEMIC ROLLOVER] Overlapping term dates for school ${schoolId}, session ${activeSession.name}. Current settings were preserved.`
          );

          continue;
        }

        activeTerm = activeTerms[0] || null;
      } else {
        // No dated terms: preserve the manually selected
        // term for this session, if one exists.
        activeTerm =
          sessionTerms.find((term) => term.isCurrent) || null;
      }

      /**
       * Apply the validated academic context.
       *
       * These updates happen only after session and term
       * date validation has completed successfully.
       */
      await Session.updateMany(
        { schoolId },
        { $set: { isCurrent: false } }
      );

      await Session.updateOne(
        {
          _id: activeSession._id,
          schoolId,
        },
        { $set: { isCurrent: true } }
      );

      // Enforce a single current term across the school.
      await Term.updateMany(
        { schoolId },
        { $set: { isCurrent: false } }
      );

      if (activeTerm) {
        await Term.updateOne(
          {
            _id: activeTerm._id,
            schoolId,
            sessionId: activeSession._id,
          },
          { $set: { isCurrent: true } }
        );
      }

      // Keep the school's saved settings synchronized.
      await School.findByIdAndUpdate(schoolId, {
        $set: {
          currentSession: activeSession.name,
          currentTerm: activeTerm?.name || "",
        },
      });

      console.log(
        `[ACADEMIC ROLLOVER] School ${schoolId}: session=${activeSession.name}, term=${activeTerm?.name || "none"}`
      );
    } catch (error) {
      console.error(
        `[ACADEMIC ROLLOVER] Failed for school ${schoolId}:`,
        error.message
      );
    }
  }
}

/**
 * =========================================
 * START SCHEDULER
 * =========================================
 */
export function startAcademicRolloverScheduler() {
  // Refresh once at startup.
  runAcademicRollover().catch((error) => {
    console.error(
      "[ACADEMIC ROLLOVER] Startup check failed:",
      error.message
    );
  });

  // Recheck every hour using Nigeria time.
  cron.schedule(
    "0 * * * *",
    () => {
      runAcademicRollover().catch((error) => {
        console.error(
          "[ACADEMIC ROLLOVER] Scheduled check failed:",
          error.message
        );
      });
    },
    {
      timezone: "Africa/Lagos",
    }
  );

  console.log("[ACADEMIC ROLLOVER] Scheduler started");
}
