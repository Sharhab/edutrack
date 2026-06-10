import { Parent } from "./parent.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { hashPassword } from "../../utils/hash.js";
import mongoose from "mongoose";

/* =========================
   VALIDATE STUDENTS
========================= */
async function validateStudentIds(studentIds, schoolId) {
  if (!studentIds?.length) return;

  const { Student } = await import("../students/student.model.js");

  const students = await Student.find({
    _id: { $in: studentIds },
    schoolId,
  }).select("_id");

  if (students.length !== studentIds.length) {
    throw new ApiError(
      400,
      "One or more student IDs are invalid or not in this school"
    );
  }
}

/* =========================
   CREATE PARENT (ATOMIC FIX)
========================= */
export async function createParent(payload, schoolId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingUser = await User.findOne({
      email: payload.email.toLowerCase(),
    }).session(session);

    if (existingUser) {
      throw new ApiError(400, "A user with this email already exists");
    }

    await validateStudentIds(payload.studentIds, schoolId);

    const passwordHash = await hashPassword(payload.password);

    /* ================= USER ================= */
    const user = await User.create(
      [
        {
          schoolId,
          role: "parent",
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email.toLowerCase(),
          phone: payload.phone,
          passwordHash,
          isActive: true,
        },
      ],
      { session }
    );

    const userId = user[0]._id;

    /* ================= PARENT ================= */
    const parent = await Parent.create(
      [
        {
          schoolId,
          userId,
          occupation: payload.occupation,
          address: payload.address,
          relationshipToStudent: payload.relationshipToStudent,
          studentIds: payload.studentIds || [],
        },
      ],
      { session }
    );

    const parentId = parent[0]._id;

    const { Student } = await import("../students/student.model.js");

    /* ================= LINK STUDENTS ================= */
    if (payload.studentIds?.length) {
      await Student.updateMany(
        { _id: { $in: payload.studentIds }, schoolId },
        { $addToSet: { parentIds: parentId } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return Parent.findById(parentId)
      .populate("userId", "firstName lastName email phone isActive role")
      .populate("studentIds", "firstName lastName admissionNumber");
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

/* =========================
   UPDATE PARENT (ATOMIC FIX)
========================= */
export async function updateParent(id, payload, schoolId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const parent = await Parent.findOne({ _id: id, schoolId }).session(session);

    if (!parent) throw new ApiError(404, "Parent not found");

    const user = await User.findOne({
      _id: parent.userId,
      schoolId,
    }).session(session);

    if (!user) throw new ApiError(404, "Parent user not found");

    const { Student } = await import("../students/student.model.js");

    /* ================= UPDATE STUDENT LINKS ================= */
    if (payload.studentIds !== undefined) {
      await validateStudentIds(payload.studentIds, schoolId);

      // remove old links
      await Student.updateMany(
        { parentIds: parent._id, schoolId },
        { $pull: { parentIds: parent._id } },
        { session }
      );

      // add new links
      if (payload.studentIds.length) {
        await Student.updateMany(
          { _id: { $in: payload.studentIds }, schoolId },
          { $addToSet: { parentIds: parent._id } },
          { session }
        );
      }

      parent.studentIds = payload.studentIds;
    }

    /* ================= USER UPDATE ================= */
    if (payload.firstName !== undefined) user.firstName = payload.firstName;
    if (payload.lastName !== undefined) user.lastName = payload.lastName;
    if (payload.phone !== undefined) user.phone = payload.phone;
    if (payload.isActive !== undefined) user.isActive = payload.isActive;

    /* ================= PARENT UPDATE ================= */
    if (payload.occupation !== undefined)
      parent.occupation = payload.occupation;

    if (payload.address !== undefined)
      parent.address = payload.address;

    if (payload.relationshipToStudent !== undefined)
      parent.relationshipToStudent = payload.relationshipToStudent;

    await user.save({ session });
    await parent.save({ session });

    await session.commitTransaction();
    session.endSession();

    return Parent.findById(parent._id)
      .populate("userId", "firstName lastName email phone isActive role")
      .populate("studentIds", "firstName lastName admissionNumber");
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function deleteParent(id, schoolId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const parent = await Parent.findOne({ _id: id, schoolId }).session(session);

    if (!parent) {
      throw new ApiError(404, "Parent not found");
    }

    // Get linked student model
    const { Student } = await import("../students/student.model.js");

    // 1. Remove parent reference from all linked students
    if (parent.studentIds?.length) {
      await Student.updateMany(
        {
          _id: { $in: parent.studentIds },
          schoolId,
        },
        {
          $pull: { parentIds: parent._id },
        },
        { session }
      );
    }

    // 2. Delete parent profile
    await Parent.deleteOne({ _id: id, schoolId }).session(session);

    // 3. Delete linked user account
    await User.deleteOne({ _id: parent.userId, schoolId }).session(session);

    await session.commitTransaction();
    session.endSession();

    return {
      deleted: true,
      parentId: id,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function listParents(schoolId) {
  return Parent.find({ schoolId })
    .populate("userId", "firstName lastName email phone isActive role")
    .populate("studentIds", "firstName lastName admissionNumber")
    .sort({ createdAt: -1 });
}

export async function getParentById(id, schoolId) {
  const parent = await Parent.findOne({
    _id: id,
    schoolId,
  })
    .populate("userId", "firstName lastName email phone isActive role")
    .populate("studentIds", "firstName lastName admissionNumber");

  if (!parent) {
    throw new ApiError(404, "Parent not found");
  }

  return parent;
}

export async function bulkCreateParents(rows, schoolId) {
  const result = {
    summary: {
      total: rows.length,
      created: 0,
      failed: 0,
      skipped: 0,
    },
    errors: [],
    createdParents: [],
  };

  const { Student } = await import("../students/student.model.js");

  for (let i = 0; i < rows.length; i++) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const payload = rows[i];

      // 1. Normalize email
      const email = payload.email.toLowerCase().trim();

      // 2. Duplicate check
      const existingUser = await User.findOne({ email }).session(session);

      if (existingUser) {
        result.summary.skipped++;
        result.errors.push({
          index: i,
          email,
          error: "Duplicate email",
        });
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      // 3. Validate students
      await validateStudentIds(payload.studentIds, schoolId);

      // 4. Hash password
      const passwordHash = await hashPassword(payload.password);

      // 5. Create User
      const [user] = await User.create(
        [
          {
            schoolId,
            role: "parent",
            firstName: payload.firstName,
            lastName: payload.lastName,
            email,
            phone: payload.phone,
            passwordHash,
            isActive: true,
          },
        ],
        { session }
      );

      // 6. Create Parent
      const [parent] = await Parent.create(
        [
          {
            schoolId,
            userId: user._id,
            occupation: payload.occupation,
            address: payload.address,
            relationshipToStudent: payload.relationshipToStudent,
            studentIds: payload.studentIds || [],
          },
        ],
        { session }
      );

      // 7. Link Students → Parent
      if (payload.studentIds?.length) {
        await Student.updateMany(
          {
            _id: { $in: payload.studentIds },
            schoolId,
          },
          {
            $addToSet: { parentIds: parent._id },
          },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      result.summary.created++;

      result.createdParents.push({
        index: i,
        parentId: parent._id,
        email,
        status: "created",
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      result.summary.failed++;

      result.errors.push({
        index: i,
        error: error.message,
        row: rows[i],
      });
    }
  }

  return result;
}