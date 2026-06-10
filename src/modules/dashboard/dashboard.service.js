
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
/* =========================================
   SCHOOL ADMIN DASHBOARD
   ===================================== */

export async function getSchoolAdminDashboard(user) {
const schoolId = user.schoolId;

const [
students,
teachers,
classes,
subjects,
attendance,
feeStats,
recentAnnouncements,
recentResults,
] = await Promise.all([
Student.countDocuments({ schoolId }),


Teacher.countDocuments({
  schoolId,
  status: "active",
}),

ClassModel.countDocuments({
  schoolId,
}),

SubjectModel.countDocuments({
  schoolId,
}),

Attendance.countDocuments({
  schoolId,
}),

StudentFee.aggregate([
  {
    $match: {
      schoolId: new mongoose.Types.ObjectId(
        schoolId
      ),
    },
  },
  {
    $group: {
      _id: null,

      totalRevenue: {
        $sum: "$amountPaid",
      },

      totalExpected: {
        $sum: "$totalAmount",
      },

      totalInvoices: {
        $sum: 1,
      },

      paidInvoices: {
        $sum: {
          $cond: [
            {
              $eq: [
                "$status",
                "paid",
              ],
            },
            1,
            0,
          ],
        },
      },

      pendingInvoices: {
        $sum: {
          $cond: [
            {
              $ne: [
                "$status",
                "paid",
              ],
            },
            1,
            0,
          ],
        },
      },
    },
  },
]),

Announcement.find({ schoolId })
  .sort({ createdAt: -1 })
  .limit(5)
  .select(
    "title message createdAt"
  ),

Result.find({ schoolId })
  .populate(
    "studentId",
    "firstName lastName"
  )
  .populate(
    "subjectId",
    "name code"
  )
  .sort({ createdAt: -1 })
  .limit(10),


]);

const finance = feeStats?.[0] || {
totalRevenue: 0,
totalExpected: 0,
totalInvoices: 0,
paidInvoices: 0,
pendingInvoices: 0,
};

const outstanding =
finance.totalExpected -
finance.totalRevenue;

return {
stats: {
students,
teachers,


  parents: 0,

  classes,
  subjects,
  attendance,

  revenue:
    finance.totalRevenue,

  expected:
    finance.totalExpected,

  outstanding,

  invoicesTotal:
    finance.totalInvoices,

  invoicesPaid:
    finance.paidInvoices,

  invoicesPending:
    finance.pendingInvoices,

  paymentsTotal:
    finance.paidInvoices,
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
