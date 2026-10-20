
import mongoose from "mongoose";

import { Student } from "../students/student.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Parent } from "../parents/parent.model.js";
import { ClassModel } from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Result } from "../results/result.model.js";
import { Announcement } from "../announcements/announcement.model.js";
import { Payment } from "../finance/fees/fee-payment.model.js";
import { StudentFee } from "../finance/fees/studentFee.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { School } from "../schools/school.model.js";
import {
  getParentProfileByUser,
  ensureParentOwnsStudent,
} from "../parents/parent.guard.js";

import { ApiError } from "../../utils/apiError.js";

async function getTeacherAttendancePending({
  schoolId,
  classIds,
  sessionId,
  termId,
  date,
}) {
  if (!classIds.length || !sessionId || !termId) {
    return 0;
  }

  const pendingClasses = await Promise.all(
    classIds.map(async (classId) => {
      const students = await Student.find({
        schoolId,
        classId,
      })
        .select("_id")
        .lean();

      if (students.length === 0) {
        return 0;
      }

      const studentIds = students.map(
        (student) => student._id
      );

      const markedCount = await Attendance.countDocuments({
        schoolId,
        classId,
        sessionId,
        termId,
        date,
        studentId: { $in: studentIds },
      });

      return markedCount < students.length ? 1 : 0;
    })
  );

  return pendingClasses.reduce(
    (total, count) => total + count,
    0
  );
}
/* =====================================
   HELPERS
===================================== */
function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeSchoolId(user) {
  if (!user?.schoolId) {
    throw new ApiError(
      400,
      "Invalid user school context"
    );
  }

  return new mongoose.Types.ObjectId(
    user.schoolId
  );
}
export async function getSchoolAdminDashboard(user, selection = {}) {
  const schoolId = normalizeSchoolId(user);
  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  const requestedSessionId = String(
    selection.sessionId || ""
  ).trim();

  const requestedTermId = String(
    selection.termId || ""
  ).trim();

  if (
    requestedSessionId &&
    !mongoose.Types.ObjectId.isValid(requestedSessionId)
  ) {
    throw new ApiError(400, "Invalid sessionId");
  }

  if (
    requestedTermId &&
    !mongoose.Types.ObjectId.isValid(requestedTermId)
  ) {
    throw new ApiError(400, "Invalid termId");
  }

  let activeSession = null;
  let activeTerm = null;

  // If a term is selected, verify it belongs to this school
  // and, when supplied, the selected session.
  if (requestedTermId) {
    activeTerm = await Term.findOne({
      _id: requestedTermId,
      schoolId,
      ...(requestedSessionId
        ? { sessionId: requestedSessionId }
        : {}),
    });

    if (!activeTerm) {
      throw new ApiError(
        400,
        "Selected term does not belong to this school or session"
      );
    }

    activeSession = await Session.findOne({
      _id: activeTerm.sessionId,
      schoolId,
    });

    if (!activeSession) {
      throw new ApiError(
        404,
        "The selected term's session was not found"
      );
    }
  } else if (requestedSessionId) {
    activeSession = await Session.findOne({
      _id: requestedSessionId,
      schoolId,
    });

    if (!activeSession) {
      throw new ApiError(
        404,
        "Selected session not found"
      );
    }
  } else {
    // Default to the school's current session.
    activeSession = await Session.findOne({
      schoolId,
      isCurrent: true,
    }).sort({ createdAt: -1 });

    if (!activeSession && school.currentSession) {
      activeSession = await Session.findOne({
        schoolId,
        name: school.currentSession,
      });
    }
  }

  if (activeSession && !activeTerm) {
    // Prefer the current term in the selected session.
    activeTerm = await Term.findOne({
      schoolId,
      sessionId: activeSession._id,
      isCurrent: true,
    }).sort({ createdAt: -1 });

    if (
      !activeTerm &&
      !requestedSessionId &&
      school.currentTerm
    ) {
      activeTerm = await Term.findOne({
        schoolId,
        sessionId: activeSession._id,
        name: school.currentTerm,
      });
    }

    // If browsing an old session, default to its latest term.
    if (!activeTerm && requestedSessionId) {
      activeTerm = await Term.findOne({
        schoolId,
        sessionId: activeSession._id,
      }).sort({
        order: -1,
        startDate: -1,
        createdAt: -1,
      });
    }
  }

  const hasSelectedPeriod = Boolean(
    activeSession && activeTerm
  );

  // Current-period fee obligations. Legacy records that contain
  // session/term names instead of IDs are supported as well.
  const periodMatch = hasSelectedPeriod
    ? {
        schoolId,
        $or: [
          {
            sessionId: activeSession._id,
            termId: activeTerm._id,
          },
          {
            sessionId: { $exists: false },
            termId: { $exists: false },
            session: activeSession.name,
            term: activeTerm.name,
          },
        ],
      }
    : null;

  const attendanceMatch = hasSelectedPeriod
    ? {
        schoolId,
        sessionId: activeSession._id,
        termId: activeTerm._id,
        status: "present",
      }
    : null;

  const [
    students,
    teachers,
    classes,
    subjects,
    attendance,
    allFinanceRows,
    selectedFinanceRows,
    recentAnnouncements,
    recentResults,
    selectedFees,
  ] = await Promise.all([
    // These are school-wide directory counts.
    Student.countDocuments({ schoolId }),

    Teacher.countDocuments({
      schoolId,
      status: "active",
    }),

    ClassModel.countDocuments({ schoolId }),

    SubjectModel.countDocuments({ schoolId }),

    attendanceMatch
      ? Attendance.countDocuments(attendanceMatch)
      : Promise.resolve(0),

    // Keep all-time totals available for a separate report.
    StudentFee.aggregate([
      { $match: { schoolId } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$amountPaid" },
          expected: { $sum: "$totalAmount" },
          outstanding: { $sum: "$balance" },
          invoicesTotal: { $sum: 1 },
          invoicesPaid: {
            $sum: {
              $cond: [
                { $eq: ["$status", "paid"] },
                1,
                0,
              ],
            },
          },
          invoicesPending: {
            $sum: {
              $cond: [
                { $gt: ["$balance", 0] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    // Main finance figures are restricted to the selected term.
    periodMatch
      ? StudentFee.aggregate([
          { $match: periodMatch },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$amountPaid" },
              expected: { $sum: "$totalAmount" },
              outstanding: { $sum: "$balance" },
              invoicesTotal: { $sum: 1 },
              invoicesPaid: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "paid"] },
                    1,
                    0,
                  ],
                },
              },
              invoicesPending: {
                $sum: {
                  $cond: [
                    { $gt: ["$balance", 0] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ])
      : Promise.resolve([]),

    // Announcements remain school-wide.
    Announcement.find({ schoolId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title message createdAt"),

    // Only return results from the selected academic period.
    hasSelectedPeriod
      ? Result.find({
          schoolId,
          sessionId: activeSession._id,
          termId: activeTerm._id,
        })
          .populate(
            "studentId",
            "firstName lastName"
          )
          .populate(
            "subjectId",
            "name code"
          )
          .sort({ createdAt: -1 })
          .limit(10)
      : Promise.resolve([]),

    periodMatch
      ? StudentFee.find(periodMatch)
          .select("_id")
          .lean()
      : Promise.resolve([]),
  ]);

  const all = allFinanceRows[0] || {};
  const selected = selectedFinanceRows[0] || {};

  const finance = (row) => ({
    revenue: Number(row.revenue || 0),
    expected: Number(row.expected || 0),
    outstanding: Number(row.outstanding || 0),
    invoicesTotal: Number(row.invoicesTotal || 0),
    invoicesPaid: Number(row.invoicesPaid || 0),
    invoicesPending: Number(row.invoicesPending || 0),
  });

  // Count successful payment records linked to fees in this period.
  const selectedFeeIds = selectedFees.map(
    (fee) => fee._id
  );

  const paymentsTotal = selectedFeeIds.length
    ? await Payment.countDocuments({
        schoolId,
        studentFeeId: {
          $in: selectedFeeIds,
        },
        status: "success",
      })
    : 0;

  return {
    currentSession: activeSession?.name || "",
    currentTerm: activeTerm?.name || "",
    currentSessionId: activeSession?._id || null,
    currentTermId: activeTerm?._id || null,

    isCurrentPeriod: Boolean(
      activeSession?.isCurrent &&
      activeTerm?.isCurrent
    ),

    stats: {
      students,
      teachers,
      parents: 0,
      classes,
      subjects,
      attendance,

      // These are now selected-period values.
      ...finance(selected),

      // Preserve all-time figures for future reporting.
      allTimeFinance: finance(all),

      paymentsTotal,
    },

    recentAnnouncements,
    recentResults,
  };
}

/* =====================================
   PARENT DASHBOARD
===================================== */
export async function getParentDashboard(user) {
  return {
    stats: {
      childrenLinked: 0,
      unreadNotices: 0,
      attendanceRate: 0,
      latestResultReleased: false,
    },

    children: [],

    recentAnnouncements: [],
  };
}


/* =====================================
   PARENT CHILD SUMMARY
===================================== */
export async function getParentChildSummary(
  user,
  studentId
) {
  await ensureParentOwnsStudent(
    user,
    studentId
  );

  const schoolId =
    normalizeSchoolId(user);

  const student =
    await Student.findOne({
      _id: studentId,
      schoolId,
    }).populate(
      "classId",
      "name level"
    );

  if (!student) {
    throw new ApiError(
      404,
      "Student not found"
    );
  }

  return {
    student,
  };
}

/* =========================================
   TEACHER DASHBOARD
========================================= */
export async function getTeacherDashboard(user) {
  const schoolId = normalizeSchoolId(user);

  const teacher = await Teacher.findOne({
    schoolId,
    userId: user._id,
    status: "active",
  })
    .populate("classIds", "name level")
    .populate("subjectIds", "name code");

  if (!teacher) {
    throw new ApiError(404, "Teacher profile not found");
  }

  const assignedClasses = teacher.classIds || [];
  const assignedSubjects = teacher.subjectIds || [];

  const classIds = assignedClasses.map(
    (cls) => cls._id
  );

  /* =========================================
     SCHOOL AND ACADEMIC PERIOD
  ========================================= */

  const school = await School.findById(schoolId)
    .select("currentSession currentTerm")
    .lean();

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  let activeSession = await Session.findOne({
    schoolId,
    isCurrent: true,
  }).sort({ createdAt: -1 });

  if (!activeSession && school.currentSession) {
    activeSession = await Session.findOne({
      schoolId,
      name: school.currentSession,
    });
  }

  let activeTerm = null;

  if (activeSession) {
    activeTerm = await Term.findOne({
      schoolId,
      sessionId: activeSession._id,
      isCurrent: true,
    }).sort({ createdAt: -1 });

    if (!activeTerm && school.currentTerm) {
      activeTerm = await Term.findOne({
        schoolId,
        sessionId: activeSession._id,
        name: school.currentTerm,
      });
    }
  }

  /* =========================================
     TOTAL STUDENTS
  ========================================= */

  const students = classIds.length
    ? await Student.countDocuments({
        schoolId,
        classId: { $in: classIds },
      })
    : 0;

  /* =========================================
     RECENT ANNOUNCEMENTS
  ========================================= */

  const recentAnnouncements = await Announcement.find({
    schoolId,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title message createdAt")
    .lean();

  /* =========================================
     RESULTS DRAFTED
  ========================================= */

  const resultsDrafted = await Result.countDocuments({
    schoolId,
    enteredBy: user._id,
  });

  /* =========================================
     ATTENDANCE PENDING
  ========================================= */

  const attendancePending =
    activeSession && activeTerm
      ? await getTeacherAttendancePending({
          schoolId,
          classIds,
          sessionId: activeSession._id,
          termId: activeTerm._id,
          date: todayDateString(),
        })
      : 0;

  /* =========================================
     BUILD ASSIGNMENTS
  ========================================= */

  const assignments = [];

  for (const cls of assignedClasses) {
    for (const subject of assignedSubjects) {
      assignments.push({
        classId: {
          _id: cls._id,
          name: cls.name,
          level: cls.level,
        },
        subjectId: {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
        },
      });
    }
  }

  /* =========================================
     DASHBOARD RESPONSE
  ========================================= */

  return {
    stats: {
      myClasses: assignedClasses.length,
      mySubjects: assignedSubjects.length,
      students,
      attendancePending,
      resultsDrafted,
    },

    myClasses: assignedClasses.map((cls) => ({
      _id: cls._id,
      name: cls.name,
      level: cls.level,
    })),

    mySubjects: assignedSubjects.map((subject) => ({
      _id: subject._id,
      name: subject.name,
      code: subject.code,
    })),

    assignments,
    recentAnnouncements,
  };
}
