import cron from "node-cron";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { School } from "../schools/school.model.js";

function getDateRange(date) {
  if (!date) return null;

  const start = new Date(date);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);

  // Treat date-only values as covering the entire calendar day.
  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    end.setUTCHours(23, 59, 59, 999);
  }

  return { start, end };
}

function isWithinDateRange(startDate, endDate, now) {
  const start = getDateRange(startDate);
  const end = getDateRange(endDate);

  if (!start || !end) {
    return false;
  }

  return start.start <= now && end.end >= now;
}

export async function runAcademicRollover() {
  const now = new Date();

  // Only sessions with both dates configured can be automatically activated.
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
      const activeSessions = schoolSessions.filter((session) =>
        isWithinDateRange(
          session.startDate,
          session.endDate,
          now
        )
      );

      // Avoid guessing when dates overlap or no session is in range.
      if (activeSessions.length !== 1) {
        continue;
      }

      const activeSession = activeSessions[0];

      await Session.updateMany(
        { schoolId },
        { $set: { isCurrent: false } }
      );

      await Session.updateOne(
        { _id: activeSession._id, schoolId },
        { $set: { isCurrent: true } }
      );

      const sessionTerms = await Term.find({
        schoolId,
        sessionId: activeSession._id,
      }).sort({ order: 1, startDate: 1 });

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

        // Overlapping term dates are ambiguous; do not guess.
        if (activeTerms.length > 1) {
          console.warn(
            `[ACADEMIC ROLLOVER] Overlapping term dates for school ${schoolId}, session ${activeSession.name}`
          );
          continue;
        }

        activeTerm = activeTerms[0] || null;

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
      } else {
        // If terms have no configured dates, preserve the existing
        // manually selected term for this session.
        activeTerm = sessionTerms.find((term) => term.isCurrent) || null;
      }

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

export function startAcademicRolloverScheduler() {
  // Run once at startup so the current academic period is refreshed,
  // then check hourly using Nigeria time.
  runAcademicRollover().catch((error) => {
    console.error(
      "[ACADEMIC ROLLOVER] Startup check failed:",
      error.message
    );
  });

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
