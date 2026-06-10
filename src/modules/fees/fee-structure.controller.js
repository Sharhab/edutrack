// import {
//   createFeeStructure,
//   listStudentFees,
//   payStudentFee,
// } from "./fee.service.js";

// /**
//  * CREATE FEE STRUCTURE
//  */
// export async function createFeeStructureHandler(
//   req,
//   res
// ) {
//   const data =
//     await createFeeStructure(
//       req.body,
//       req.user.schoolId
//     );

//   res.status(201).json({
//     success: true,
//     message:
//       "Fee structure created",
//     data,
//   });
// }

// /**
//  * LIST STUDENT FEES
//  */
// export async function listStudentFeesHandler(
//   req,
//   res
// ) {
//   const data =
//     await listStudentFees(
//       req.user.schoolId
//     );

//   res.json({
//     success: true,
//     data,
//   });
// }

// /**
//  * PAY FEE
//  */
// export async function payStudentFeeHandler(
//   req,
//   res
// ) {
//   const data =
//     await payStudentFee(
//       req.params.id,
//       req.body,
//       req.user.schoolId,
//       req.user._id
//     );

//   res.json({
//     success: true,
//     message:
//       "Payment recorded successfully",
//     data,
//   });
// }