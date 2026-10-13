
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

export async function getSchoolAdminDashboard(user) {
  const schoolId = new mongoose.Types.ObjectId(
    String(user.schoolId)
  );

  const school = await School.findById(schoolId);

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  // Resolve the active session.
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

  // Resolve the active term within that session.
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

  const periodMatch =
    activeSession && activeTerm
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

  const [
    students,
    teachers,
    classes,
    subjects,
    attendance,
    allFinanceRows,
    currentFinanceRows,
    recentAnnouncements,
    recentResults,
  ] = await Promise.all([
    Student.countDocuments({ schoolId }),

    Teacher.countDocuments({
      schoolId,
      status: "active",
    }),

    ClassModel.countDocuments({ schoolId }),
    SubjectModel.countDocuments({ schoolId }),
    Attendance.countDocuments({ schoolId }),

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
              $cond: [{ $eq: ["$status", "paid"] }, 1, 0],
            },
          },
          invoicesPending: {
            $sum: {
              $cond: [{ $gt: ["$balance", 0] }, 1, 0],
            },
          },
        },
      },
    ]),

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
                  $cond: [{ $eq: ["$status", "paid"] }, 1, 0],
                },
              },
              invoicesPending: {
                $sum: {
                  $cond: [{ $gt: ["$balance", 0] }, 1, 0],
                },
              },
            },
          },
        ])
      : Promise.resolve([]),

    Announcement.find({ schoolId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title message createdAt"),

    Result.find({ schoolId })
      .populate("studentId", "firstName lastName")
      .populate("subjectId", "name code")
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const all = allFinanceRows[0] || {};
  const current = currentFinanceRows[0] || {};

  const finance = (row) => ({
    revenue: Number(row.revenue || 0),
    expected: Number(row.expected || 0),
    outstanding: Number(row.outstanding || 0),
    invoicesTotal: Number(row.invoicesTotal || 0),
    invoicesPaid: Number(row.invoicesPaid || 0),
    invoicesPending: Number(row.invoicesPending || 0),
  });

  return {
    currentSession: activeSession?.name || "",
    currentTerm: activeTerm?.name || "",

    stats: {
      students,
      teachers,
      parents: 0,
      classes,
      subjects,
      attendance,

      // Backward-compatible all-time values.
      ...finance(all),

      // Explicit current-term values.
      currentTermRevenue: finance(current).revenue,
      currentTermExpected: finance(current).expected,
      currentTermOutstanding: finance(current).outstanding,
      currentTermInvoicesTotal: finance(current).invoicesTotal,
      currentTermInvoicesPaid: finance(current).invoicesPaid,
      currentTermInvoicesPending: finance(current).invoicesPending,

      paymentsTotal: finance(all).invoicesPaid,
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
  const schoolId = user.schoolId;

  const teacher = await Teacher.findOne({
    schoolId,
    userId: user._id,
  })
    .populate("classIds", "name level")
    .populate("subjectIds", "name code");

  if (!teacher) {
    throw new Error("Teacher profile not found");
  }

  /* =========================================
     TOTAL STUDENTS
  ========================================= */
  const students = await Student.countDocuments({
    schoolId,
    classId: {
      $in: teacher.classIds.map((c) => c._id),
    },
  });

  /* =========================================
     RECENT ANNOUNCEMENTS
  ========================================= */
  const recentAnnouncements =
    await Announcement.find({ schoolId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title message createdAt");

  /* =========================================
     RESULTS DRAFTED
  ========================================= */
  const resultsDrafted =
    await Result.countDocuments({
      schoolId,
      enteredBy: user._id,
    });

  /* =========================================
     BUILD ASSIGNMENTS
  ========================================= */
  const assignments = [];

  for (const cls of teacher.classIds) {
    for (const subject of teacher.subjectIds) {
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

  return {
    stats: {
      myClasses: teacher.classIds.length,

      mySubjects:
        teacher.subjectIds.length,

      students,

      attendancePending: 0,

      resultsDrafted,
    },

    myClasses: teacher.classIds.map(
      (cls) => ({
        _id: cls._id,
        name: cls.name,
        level: cls.level,
      })
    ),

    mySubjects: teacher.subjectIds.map(
      (subject) => ({
        _id: subject._id,
        name: subject.name,
        code: subject.code,
      })
    ),

    assignments,

    recentAnnouncements,
  };
}
