// import { FeeStructure } from "../finance/models/fee-structure.model.js";
// import { StudentFee } from "./student-fee.model.js";

// import { Student } from "../students/student.model.js";

// import { ApiError } from "../../utils/apiError.js";

// /**
//  * CREATE FEE STRUCTURE
//  */
// export async function createFeeStructure(
//   payload,
//   schoolId
// ) {
//   const exists =
//     await FeeStructure.findOne({
//       schoolId,
//       sessionId: payload.sessionId,
//       termId: payload.termId,
//       classId: payload.classId,
//     });

//   if (exists) {
//     throw new ApiError(
//       400,
//       "Fee structure already exists"
//     );
//   }

//   const totalAmount =
//     payload.items.reduce(
//       (sum, item) =>
//         sum + Number(item.amount || 0),
//       0
//     );

//   const structure =
//     await FeeStructure.create({
//       schoolId,

//       sessionId: payload.sessionId,

//       termId: payload.termId,

//       classId: payload.classId,

//       title: payload.title,

//       items: payload.items,

//       totalAmount,
//     });

//   /**
//    * AUTO ASSIGN TO STUDENTS
//    */
//   const students =
//     await Student.find({
//       schoolId,
//       classId: payload.classId,
//     });

//   if (students.length > 0) {
//     const feeDocs =
//       students.map((student) => ({
//         schoolId,

//         studentId: student._id,

//         feeStructureId:
//           structure._id,

//         totalAmount,

//         amountPaid: 0,

//         balance: totalAmount,

//         status: "unpaid",
//       }));

//     await StudentFee.insertMany(
//       feeDocs
//     );
//   }

//   return structure;
// }

// /**
//  * LIST FEES
//  */
// export async function listStudentFees(
//   schoolId
// ) {
//   return StudentFee.find({
//     schoolId,
//   })
//     .populate(
//       "studentId",
//       "firstName lastName admissionNumber"
//     )
//     .populate(
//       "feeStructureId",
//       "title totalAmount"
//     )
//     .sort({
//       createdAt: -1,
//     });
// }

// /**
//  * PAY SCHOOL FEES
//  */
// export async function payStudentFee(
//   id,
//   payload,
//   schoolId,
//   userId
// ) {
//   const fee =
//     await StudentFee.findOne({
//       _id: id,
//       schoolId,
//     });

//   if (!fee) {
//     throw new ApiError(
//       404,
//       "Fee record not found"
//     );
//   }

//   const amount =
//     Number(payload.amount);

//   if (amount <= 0) {
//     throw new ApiError(
//       400,
//       "Invalid payment amount"
//     );
//   }

//   fee.payments.push({
//     amount,

//     method:
//       payload.method || "cash",

//     reference:
//       payload.reference || "",

//     receivedBy: userId,
//   });

//   fee.amountPaid += amount;

//   fee.balance =
//     fee.totalAmount -
//     fee.amountPaid;

//   if (fee.balance <= 0) {
//     fee.status = "paid";
//     fee.balance = 0;
//   } else {
//     fee.status = "partial";
//   }

//   await fee.save();

//   return fee;
// }