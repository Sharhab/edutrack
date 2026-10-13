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

* GET PARENT PROFILE
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

* Resolve the current academic session and term.
* A term must belong to the selected session.
  */
  async function getCurrentAcademicContext(schoolId) {
  const school = await School.findById(schoolId);

if (!school) {
return {
activeSession: null,
activeTerm: null,
};
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

return {
activeSession,
activeTerm,
};
}

/**

* Extract a MongoDB document ID whether the value is
* populated, an ObjectId, or a plain string.
  */
  function getReferenceId(value) {
  if (!value) return "";

if (typeof value === "object") {
return String(value._id || value.id || "");
}

return String(value);
}

/**

* Normalize a session or term name for legacy comparisons.
  */
  function normalizeName(value) {
  return String(value || "")
  .trim()
  .toLowerCase();
  }

/**

* Resolve the academic period associated with a fee.
*
* The linked fee plan is preferred because it defines
* the academic period for which the fee was created.
* StudentFee fields are used as a fallback.
  */
  function normalizeStudentFee(document) {
  const fee =
  typeof document.toObject === "function"
  ? document.toObject()
  : { ...document };

const feePlan =
fee.feePlanId &&
typeof fee.feePlanId === "object"
? fee.feePlanId
: null;

const planSession = feePlan?.sessionId || null;
const planTerm = feePlan?.termId || null;

const sessionId =
getReferenceId(planSession) ||
getReferenceId(fee.sessionId);

const termId =
getReferenceId(planTerm) ||
getReferenceId(fee.termId);

const session =
(typeof planSession === "object" && planSession?.name) ||
fee.session ||
"";

const term =
(typeof planTerm === "object" && planTerm?.name) ||
fee.term ||
"";

return {
...fee,
sessionId: sessionId || null,
termId: termId || null,
session,
term,
};
}

/**

* Check whether a fee belongs to the active session and term.
  */
  function belongsToCurrentTerm(
  fee,
  activeSession,
  activeTerm
  ) {
  if (!activeSession || !activeTerm) {
  return false;
  }

const activeSessionId = String(activeSession._id);
const activeTermId = String(activeTerm._id);

const feeSessionId = getReferenceId(fee.sessionId);
const feeTermId = getReferenceId(fee.termId);

// Prefer academic IDs when both are available.
if (feeSessionId && feeTermId) {
return (
feeSessionId === activeSessionId &&
feeTermId === activeTermId
);
}

// Legacy fallback for records that have no complete IDs.
const sessionMatches =
normalizeName(fee.session) ===
normalizeName(activeSession.name);

const termMatches =
normalizeName(fee.term) ===
normalizeName(activeTerm.name);

return sessionMatches && termMatches;
}

/**

* PARENT DASHBOARD
  */
  export async function getParentDashboard(parentUserId) {
  const parent = await getParentProfile(parentUserId);
  const studentIds = parent.studentIds || [];
  const schoolId = parent.schoolId;

const { activeSession, activeTerm } =
await getCurrentAcademicContext(schoolId);

/**

* STUDENTS
  */
  const students = await Student.find({
  _id: { $in: studentIds },
  schoolId,
  }).populate("classId", "name");

/**

* STUDENT FEES
*
* StudentFee remains the source of truth for billed
* amounts, paid amounts and outstanding balances.
*
* Populate the fee plan's academic period so that
* older fee records can be matched to the right term.
  */
  const studentFeeDocuments = await StudentFee.find({
  studentId: { $in: studentIds },
  schoolId,
  })
  .populate({
  path: "feePlanId",
  select: "title paymentPolicy sessionId termId",
  populate: [
  {
  path: "sessionId",
  select: "name",
  },
  {
  path: "termId",
  select: "name",
  },
  ],
  })
  .sort({ createdAt: -1 });

const studentFees = studentFeeDocuments.map(
normalizeStudentFee
);

/**

* PAYMENTS
  */
  const payments = await Payment.find({
  studentId: { $in: studentIds },
  schoolId,
  }).sort({ createdAt: -1 });

/**

* ATTENDANCE
  */
  const attendance = await Attendance.find({
  studentId: { $in: studentIds },
  schoolId,
  });

/**

* RESULTS
  */
  const results = await Result.find({
  studentId: { $in: studentIds },
  schoolId,
  }).sort({ createdAt: -1 });

/**

* ANNOUNCEMENTS
  */
  const announcements = await Announcement.find({
  schoolId,
  $or: [
  { targetAudience: "all" },
  { targetAudience: "parents" },
  ],
  })
  .sort({ createdAt: -1 })
  .limit(10);

/**

* ALL-TIME FINANCE SUMMARY
*
* Includes unpaid balances from previous terms
* as well as fees for the current term.
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

* CURRENT-TERM FINANCE
  */
  const currentTermFees =
  activeSession && activeTerm
  ? studentFees.filter((fee) =>
  belongsToCurrentTerm(
  fee,
  activeSession,
  activeTerm
  )
  )
  : [];

const currentTermBilled = currentTermFees.reduce(
(sum, fee) => sum + Number(fee.totalAmount || 0),
0
);

const currentTermPaid = currentTermFees.reduce(
(sum, fee) => sum + Number(fee.amountPaid || 0),
0
);

const currentTermOutstanding = currentTermFees.reduce(
(sum, fee) => sum + Number(fee.balance || 0),
0
);

/**

* CHILDREN SUMMARY
  */
  const children = students.map((student) => {
  const studentId = String(student._id);


const studentAttendance = attendance.filter(



  (record) =>
    String(record.studentId) === studentId
);

const presentDays = studentAttendance.filter(
  (record) => record.status === "present"
).length;

const attendanceRate = studentAttendance.length
  ? Number(
      (
        (presentDays / studentAttendance.length) *
        100
      ).toFixed(2)
    )
  : 0;

const latestResult =
  results.find(
    (result) =>
      String(result.studentId) === studentId
  ) || null;

const childFees = studentFees.filter(
  (fee) =>
    String(fee.studentId) === studentId
);

const latestChildFee = childFees[0] || null;

const childCurrentTermFees =
  currentTermFees.filter(
    (fee) =>
      String(fee.studentId) === studentId
  );

const childTotalBilled = childFees.reduce(
  (sum, fee) => sum + Number(fee.totalAmount || 0),
  0
);

const childTotalPaid = childFees.reduce(
  (sum, fee) => sum + Number(fee.amountPaid || 0),
  0
);

const childTotalOutstanding = childFees.reduce(
  (sum, fee) => sum + Number(fee.balance || 0),
  0
);

const childCurrentTermBilled =
  childCurrentTermFees.reduce(
    (sum, fee) => sum + Number(fee.totalAmount || 0),
    0
  );

const childCurrentTermPaid =
  childCurrentTermFees.reduce(
    (sum, fee) => sum + Number(fee.amountPaid || 0),
    0
  );

const childCurrentTermOutstanding =
  childCurrentTermFees.reduce(
    (sum, fee) => sum + Number(fee.balance || 0),
    0
  );

return {
  _id: student._id,
  firstName: student.firstName,
  lastName: student.lastName,
  admissionNumber: student.admissionNumber,
  className: student.classId?.name || "No Class",
  attendanceRate,

  // Prefer the active academic period for display.
  session:
    activeSession?.name ||
    latestChildFee?.session ||
    "",

  term:
    activeTerm?.name ||
    latestChildFee?.term ||
    "",

  latestResult,

  // All-time balances for this child.
  finance: {
    totalBilled: childTotalBilled,
    totalPaid: childTotalPaid,
    totalOutstanding: childTotalOutstanding,
  },

  // Current-term balances for this child.
  currentTermFinance: {
    totalBilled: childCurrentTermBilled,
    totalPaid: childCurrentTermPaid,
    totalOutstanding: childCurrentTermOutstanding,
  },
};


});

/**

* DASHBOARD RESPONSE
  */
  return {
  parent: {
  id: parent._id,
  firstName: parent.userId?.firstName || "",
  lastName: parent.userId?.lastName || "",
  email: parent.userId?.email || "",
  phone: parent.userId?.phone || "",
  occupation: parent.occupation,
  relationshipToStudent:
  parent.relationshipToStudent,
  },


currentSession: activeSession?.name || "",



currentTerm: activeTerm?.name || "",

// Preserve the existing all-time statistics.
stats: {
  totalChildren: students.length,
  totalPaid,
  totalOutstanding,
  totalBilled,

  // Current-term statistics.
  currentTermPaid,
  currentTermOutstanding,
  currentTermBilled,
},

currentTermFinance: {
  totalBilled: currentTermBilled,
  totalPaid: currentTermPaid,
  totalOutstanding: currentTermOutstanding,
},

children,
announcements,

// Legacy UI compatibility.
invoices: studentFees,

// Source of truth for parent fee balances.
studentFees,

payments,


};
}

/**

* GET MY CHILDREN
  */
  export async function getMyChildren(
  parentUserId,
  schoolId
  ) {
  const parent = await getParentProfile(parentUserId);

return Student.find({
_id: { $in: parent.studentIds || [] },
schoolId,
})
.populate("classId", "name")
.select(`       firstName
      lastName
      admissionNumber
      classId
    `);
}

/**

* CHILD FINANCE
* SOURCE OF TRUTH = STUDENT FEES
  */
  export async function getChildFinance(
  studentId,
  schoolId
  ) {
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

* CHILD INVOICES
* LEGACY SUPPORT
  */
  export async function getChildInvoices(
  studentId,
  schoolId
  ) {
  return StudentFee.find({
  studentId,
  schoolId,
  }).sort({ createdAt: -1 });
  }

/**

* CHILD RESULTS
  */
  export async function getChildResults(
  studentId,
  schoolId
  ) {
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
