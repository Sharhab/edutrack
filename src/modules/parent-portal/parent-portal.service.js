
import { Parent } from "../parents/parent.model.js";
import { Student } from "../students/student.model.js";
import { Payment } from "../finance/fees/fee-payment.model.js";
import { StudentFee } from "../finance/fees/studentFee.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Result } from "../results/result.model.js";
import { Announcement } from "../announcements/announcement.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { School } from "../schools/school.model.js";
import Class from "../classes/class.model.js";

import { ApiError } from "../../utils/apiError.js";

/**
 * =========================================
 * GET PARENT PROFILE
 * =========================================
 */
async function getParentProfile(parentUserId) {
  const parent = await Parent.findOne({
    userId: parentUserId,
  }).populate("userId", "firstName lastName email phone");

  if (!parent) {
    throw new ApiError(404, "Parent not found");
  }

  return parent;
}

/**
 * =========================================
 * GET CURRENT ACADEMIC SESSION AND TERM
 *
 * Prefer database current flags.
 * Fall back to the school's saved settings
 * when those flags are out of sync.
 * A term must belong to the selected session.
 * =========================================
 */
async function getCurrentAcademicContext(schoolId) {
  const school = await School.findById(schoolId);

  if (!school) {
    return {
      activeSession: null,
      activeTerm: null,
    };
  }

  // 1. Resolve the current session using its flag.
  let activeSession = await Session.findOne({
    schoolId,
    isCurrent: true,
  }).sort({ createdAt: -1 });

  // 2. Fall back to the session saved in School settings.
  if (!activeSession && school.currentSession) {
    activeSession = await Session.findOne({
      schoolId,
      name: school.currentSession,
    });
  }

  // 3. Resolve the term only within the selected session.
  let activeTerm = null;

  if (activeSession) {
    activeTerm = await Term.findOne({
      schoolId,
      sessionId: activeSession._id,
      isCurrent: true,
    }).sort({ createdAt: -1 });

    // 4. Fall back to the school's saved term.
    if (!activeTerm && school.currentTerm) {
      activeTerm = await Term.findOne({
        schoolId,
        sessionId: activeSession._id,
        name: school.currentTerm,
      });
    }
  }

  return {
    activeSession,
    activeTerm,
  };
}

/**
 * =========================================
 * PARENT DASHBOARD
 * =========================================
 */
export async function getParentDashboard(parentUserId) {
  const parent = await getParentProfile(parentUserId);
  const studentIds = parent.studentIds || [];

  const { activeSession, activeTerm } =
    await getCurrentAcademicContext(parent.schoolId);

  /**
   * =========================================
   * STUDENTS
   * =========================================
   */
  const students = await Student.find({
    _id: { $in: studentIds },
    schoolId: parent.schoolId,
  }).populate("classId", "name");

  /**
   * =========================================
   * STUDENT FEES
   * SOURCE OF TRUTH FOR FEE BALANCES
   * =========================================
   */
  const studentFees = await StudentFee.find({
    studentId: { $in: studentIds },
    schoolId: parent.schoolId,
  })
    .populate({
      path: "feePlanId",
      select: "paymentPolicy",
    })
    .sort({ createdAt: -1 });

  /**
   * =========================================
   * PAYMENTS
   * =========================================
   */
  const payments = await Payment.find({
    studentId: { $in: studentIds },
    schoolId: parent.schoolId,
  }).sort({ createdAt: -1 });

  /**
   * =========================================
   * ATTENDANCE
   * =========================================
   */
  const attendance = await Attendance.find({
    studentId: { $in: studentIds },
    schoolId: parent.schoolId,
  });

  /**
   * =========================================
   * RESULTS
   * =========================================
   */
  const results = await Result.find({
    studentId: { $in: studentIds },
    schoolId: parent.schoolId,
  });

  /**
   * =========================================
   * ANNOUNCEMENTS
   * =========================================
   */
  const announcements = await Announcement.find({
    schoolId: parent.schoolId,
    $or: [
      { targetAudience: "all" },
      { targetAudience: "parents" },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(10);

  /**
   * =========================================
   * FINANCE SUMMARY
   * =========================================
   */
  const totalOutstanding = studentFees.reduce(
    (sum, fee) => sum + Number(fee.balance || 0),
    0
  );

  const totalPaid = studentFees.reduce(
    (sum, fee) => sum + Number(fee.amountPaid || 0),
    0
  );

  const totalBilled = studentFees.reduce(
    (sum, fee) => sum + Number(fee.totalAmount || 0),
    0
  );

  /**
   * =========================================
   * CHILDREN SUMMARY
   * =========================================
   */
  const children = students.map((student) => {
    const studentAttendance = attendance.filter(
      (record) =>
        String(record.studentId) === String(student._id)
    );

    const presentDays = studentAttendance.filter(
      (record) => record.status === "present"
    ).length;

    const attendanceRate = studentAttendance.length
      ? (
          (presentDays / studentAttendance.length) *
          100
        ).toFixed(2)
      : "0";

    const latestResult = results
      .filter(
        (result) =>
          String(result.studentId) === String(student._id)
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      )[0];

    const childFees = studentFees.filter(
      (fee) =>
        String(fee.studentId) === String(student._id)
    );

    const latestChildFee = childFees[0];

    return {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
      className: student.classId?.name || "No Class",
      attendanceRate,

      // Use the child's latest fee period when available.
      // Otherwise use the school's current academic context.
      session:
        latestChildFee?.session ||
        activeSession?.name ||
        "",

      term:
        latestChildFee?.term ||
        activeTerm?.name ||
        "",

      latestResult,
    };
  });

  /**
   * =========================================
   * DASHBOARD RESPONSE
   * =========================================
   */
  return {
    parent: {
      id: parent._id,
      firstName: parent.userId?.firstName || "",
      lastName: parent.userId?.lastName || "",
      email: parent.userId?.email || "",
      phone: parent.userId?.phone || "",
      occupation: parent.occupation,
      relationshipToStudent: parent.relationshipToStudent,
    },

    currentSession: activeSession?.name || "",
    currentTerm: activeTerm?.name || "",

    stats: {
      totalChildren: students.length,
      totalPaid,
      totalOutstanding,
      totalBilled,
    },

    children,
    announcements,

    // Legacy UI compatibility.
    invoices: studentFees,

    // Current source of truth for parent fee balances.
    studentFees,

    payments,
  };
}

/**
 * =========================================
 * GET MY CHILDREN
 * =========================================
 */
export async function getMyChildren(parentUserId, schoolId) {
  const parent = await getParentProfile(parentUserId);

  return Student.find({
    _id: { $in: parent.studentIds || [] },
    schoolId,
  })
    .populate("classId", "name")
    .select(`
      firstName
      lastName
      admissionNumber
      classId
    `);
}

/**
 * =========================================
 * CHILD FINANCE
 * SOURCE OF TRUTH = STUDENT FEES
 * =========================================
 */
export async function getChildFinance(studentId, schoolId) {
  const studentFees = await StudentFee.find({
    studentId,
    schoolId,
  }).sort({ createdAt: -1 });

  const payments = await Payment.find({
    studentId,
    schoolId,
  }).sort({ createdAt: -1 });

  const totalBilled = studentFees.reduce(
    (sum, fee) => sum + Number(fee.totalAmount || 0),
    0
  );

  const totalPaid = studentFees.reduce(
    (sum, fee) => sum + Number(fee.amountPaid || 0),
    0
  );

  const balance = studentFees.reduce(
    (sum, fee) => sum + Number(fee.balance || 0),
    0
  );

  return {
    studentId,
    finance: {
      totalBilled,
      totalPaid,
      balance,
    },
    studentFees,
    payments,
  };
}

/**
 * =========================================
 * CHILD INVOICES
 * LEGACY SUPPORT
 * =========================================
 */
export async function getChildInvoices(studentId, schoolId) {
  return StudentFee.find({
    studentId,
    schoolId,
  }).sort({ createdAt: -1 });
}

/**
 * =========================================
 * CHILD RESULTS
 * =========================================
 */
export async function getChildResults(studentId, schoolId) {
  const results = await Result.find({
    studentId,
    schoolId,
  }).sort({ createdAt: -1 });

  return results.map((result) => ({
    _id: result._id,

    subjectName:
      result.subjectName ||
      result.subject ||
      "Subject",

    session: result.session || "",
    term: result.term || "",

    caScore: result.caScore || 0,
    examScore: result.examScore || 0,

    totalScore:
      result.totalScore ||
      (
        Number(result.caScore || 0) +
        Number(result.examScore || 0)
      ),

    grade: result.grade || "",
    remark: result.remark || "",

    createdAt: result.createdAt,
  }));
}
