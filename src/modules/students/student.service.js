

import crypto from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { Student } from "./student.model.js";
import { ClassModel } from "../classes/class.model.js";
import { Parent } from "../parents/parent.model.js";
import { User } from "../users/user.model.js";
import { School } from "../schools/school.model.js";
import { ApiError } from "../../utils/apiError.js";

const STUDENT_ROLE = "student";
const PASSWORD_HASH_ROUNDS = 12;

const STUDENT_STATUSES = new Set([
  "active",
  "inactive",
  "suspended",
  "graduated",
]);

const ENTRY_TYPES = new Set([
  "new",
  "transfer",
  "promotion",
  "reentry",
]);

const STUDENT_FIELDS = [
  "admissionNumber",
  "firstName",
  "middleName",
  "lastName",
  "gender",
  "dateOfBirth",
  "enrollmentDate",
  "entryType",
  "previousSchool",
  "stateOfOrigin",
  "lga",
  "address",
  "email",
  "phone",
  "emergencyName",
  "emergencyPhone",
  "bloodGroup",
  "genotype",
  "nin",
  "birthCertificateNo",
  "photo",
];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : value;
}

function normalizeAdmissionNumber(value) {
  return String(value ?? "").trim();
}

function normalizeParentIds(parentIds = []) {
  if (!Array.isArray(parentIds)) {
    throw new ApiError(400, "Parent IDs must be an array");
  }

  const ids = [...new Set(parentIds.map(String))];

  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "One or more parent IDs are invalid");
    }
  }

  return ids;
}

function validateStudentInput(payload) {
  const admissionNumber = normalizeAdmissionNumber(
    payload.admissionNumber
  );

  if (!admissionNumber) {
    throw new ApiError(400, "Admission number is required");
  }

  if (!normalizeText(payload.firstName)) {
    throw new ApiError(400, "First name is required");
  }

  if (!normalizeText(payload.lastName)) {
    throw new ApiError(400, "Last name is required");
  }

  if (
    payload.status !== undefined &&
    !STUDENT_STATUSES.has(payload.status)
  ) {
    throw new ApiError(400, "Invalid student status");
  }

  if (
    payload.entryType !== undefined &&
    !ENTRY_TYPES.has(payload.entryType)
  ) {
    throw new ApiError(400, "Invalid student entry type");
  }

  if (
    payload.gender !== undefined &&
    !["male", "female"].includes(payload.gender)
  ) {
    throw new ApiError(400, "Invalid student gender");
  }

  return {
    ...payload,
    admissionNumber,
    firstName: normalizeText(payload.firstName),
    middleName: normalizeText(payload.middleName ?? ""),
    lastName: normalizeText(payload.lastName),
  };
}

function isActiveStudent(student) {
  return student.status === "active";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getSchool(schoolId) {
  if (
    !schoolId ||
    !mongoose.Types.ObjectId.isValid(String(schoolId))
  ) {
    throw new ApiError(403, "Valid school context is required");
  }

  const school = await School.findById(schoolId).select(
    "_id isActive settings.allowStudentLogin"
  );

  if (!school || school.isActive === false) {
    throw new ApiError(404, "School not found or inactive");
  }

  return school;
}

async function validateClassId(classId, schoolId) {
  if (
    !classId ||
    !mongoose.Types.ObjectId.isValid(String(classId))
  ) {
    throw new ApiError(400, "A valid class is required");
  }

  const classDoc = await ClassModel.findOne({
    _id: classId,
    schoolId,
  }).select("_id");

  if (!classDoc) {
    throw new ApiError(400, "Selected class is invalid");
  }

  return classDoc._id;
}

async function validateParentIds(parentIds, schoolId) {
  const ids = normalizeParentIds(parentIds);

  if (!ids.length) return ids;

  const count = await Parent.countDocuments({
    _id: { $in: ids },
    schoolId,
  });

  if (count !== ids.length) {
    throw new ApiError(
      400,
      "One or more parent IDs are invalid for this school"
    );
  }

  return ids;
}

async function getPopulatedStudent(studentId, schoolId) {
  return Student.findOne({
    _id: studentId,
    schoolId,
  })
    .populate("classId", "name level")
    .populate({
      path: "parentIds",
      populate: {
        path: "userId",
        select: "firstName lastName email phone",
      },
    });
}

async function linkStudentToParents(studentId, parentIds, schoolId) {
  if (!parentIds.length) return;

  await Parent.updateMany(
    {
      _id: { $in: parentIds },
      schoolId,
    },
    {
      $addToSet: { studentIds: studentId },
    }
  );
}

async function synchronizeParentLinks(
  studentId,
  parentIds,
  schoolId
) {
  await Parent.updateMany(
    {
      schoolId,
      studentIds: studentId,
    },
    {
      $pull: { studentIds: studentId },
    }
  );

  await linkStudentToParents(studentId, parentIds, schoolId);
}

/**
 * Creates a student login account.
 *
 * The password is generated randomly and hashed before storage.
 * The temporary password is returned only when a new account
 * is created successfully.
 *
 * Existing accounts are never given a new password here.
 */
async function createStudentLoginAccount(student, school) {
  if (school.settings?.allowStudentLogin === false) {
    return {
      enabled: false,
      created: false,
      credentials: null,
    };
  }

  const existingAccount = await User.findOne({
    schoolId: student.schoolId,
    studentId: student._id,
    role: STUDENT_ROLE,
  });

  if (existingAccount) {
    const shouldBeActive = isActiveStudent(student);

    if (existingAccount.isActive !== shouldBeActive) {
      existingAccount.isActive = shouldBeActive;
      await existingAccount.save();
    }

    return {
      enabled: true,
      created: false,
      credentials: null,
    };
  }

  if (!isActiveStudent(student)) {
    return {
      enabled: true,
      created: false,
      credentials: null,
      reason: "Student is not active",
    };
  }

  const temporaryPassword = crypto
    .randomBytes(12)
    .toString("base64url");

  const passwordHash = await bcrypt.hash(
    temporaryPassword,
    PASSWORD_HASH_ROUNDS
  );

  // User.email is required by the current User schema.
  // The reserved .invalid domain is not a real email destination.
  const internalEmail =
    `student.${student._id}@students.edutrack.invalid`;

  try {
    const createdUser = await User.create({
      schoolId: student.schoolId,
      studentId: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: internalEmail,
      passwordHash,
      role: STUDENT_ROLE,
      isActive: true,
    });

    return {
      enabled: true,
      created: true,
      userId: createdUser._id,
      credentials: {
        admissionNumber: student.admissionNumber,
        temporaryPassword,
        loginMethod: "admissionNumber",
      },
    };
  } catch (error) {
    // A concurrent enrollment may have created the account first.
    // Do not overwrite that account or generate replacement credentials.
    const racedAccount = await User.findOne({
      schoolId: student.schoolId,
      studentId: student._id,
      role: STUDENT_ROLE,
    });

    if (racedAccount) {
      return {
        enabled: true,
        created: false,
        credentials: null,
      };
    }

    throw error;
  }
}

async function synchronizeStudentAccountStatus(student) {
  const account = await User.findOne({
    schoolId: student.schoolId,
    studentId: student._id,
    role: STUDENT_ROLE,
  });

  if (!account) return;

  account.firstName = student.firstName;
  account.lastName = student.lastName;
  account.isActive = isActiveStudent(student);

  await account.save();
}

function buildStudentDocument(payload, schoolId, classId, parentIds) {
  return {
    schoolId,
    classId,
    parentIds,
    admissionNumber: payload.admissionNumber,
    firstName: payload.firstName,
    middleName: payload.middleName || "",
    lastName: payload.lastName,
    gender: payload.gender || "male",
    dateOfBirth: payload.dateOfBirth || null,
    enrollmentDate: payload.enrollmentDate || new Date(),
    entryType: payload.entryType || "new",
    previousSchool: payload.previousSchool || "",
    stateOfOrigin: payload.stateOfOrigin || "",
    lga: payload.lga || "",
    address: payload.address || "",
    email: payload.email || "",
    phone: payload.phone || "",
    emergencyName: payload.emergencyName || "",
    emergencyPhone: payload.emergencyPhone || "",
    bloodGroup: payload.bloodGroup || "",
    genotype: payload.genotype || "",
    nin: payload.nin || "",
    birthCertificateNo: payload.birthCertificateNo || "",
    status: payload.status || "active",
    photo: payload.photo || "",
  };
}

/**
 * CREATE STUDENT
 *
 * Creates the student and, when enabled, the login account.
 * If enrollment fails after account creation, only the account
 * created by this operation is removed.
 */
export async function createStudent(payload, schoolId) {
  const input = validateStudentInput(payload);
  const school = await getSchool(schoolId);

  const existing = await Student.findOne({
    schoolId,
    admissionNumber: input.admissionNumber,
  }).select("_id");

  if (existing) {
    throw new ApiError(
      409,
      "Student with this admission number already exists"
    );
  }

  const classId = await validateClassId(input.classId, schoolId);

  const parentIds = await validateParentIds(
    input.parentIds || [],
    schoolId
  );

  let student;
  let createdAccountId = null;

  try {
    student = await Student.create(
      buildStudentDocument(input, schoolId, classId, parentIds)
    );

    const account = await createStudentLoginAccount(student, school);

    if (account.created && account.userId) {
      createdAccountId = account.userId;
    }

    await linkStudentToParents(student._id, parentIds, schoolId);

    const populated = await getPopulatedStudent(
      student._id,
      schoolId
    );

    if (!populated) {
      throw new ApiError(
        500,
        "Student was created but could not be loaded"
      );
    }

    return {
      ...populated.toObject(),
      loginAccount: {
        enabled: account.enabled,
        created: account.created,
      },
      loginCredentials: account.credentials,
    };
  } catch (error) {
    // Delete only the account created during this enrollment attempt.
    if (createdAccountId && student?._id) {
      await User.deleteOne({
        _id: createdAccountId,
        schoolId,
        studentId: student._id,
        role: STUDENT_ROLE,
      }).catch(() => {});
    }

    if (student?._id) {
      await Parent.updateMany(
        {
          schoolId,
          studentIds: student._id,
        },
        {
          $pull: { studentIds: student._id },
        }
      ).catch(() => {});

      await Student.deleteOne({
        _id: student._id,
        schoolId,
      }).catch(() => {});
    }

    if (error?.code === 11000) {
      throw new ApiError(
        409,
        "A student with this admission number already exists"
      );
    }

    throw error;
  }
}

/**
 * LIST STUDENTS
 */
export async function listStudents(schoolId, query = {}) {
  const filter = { schoolId };

  if (query.classId) {
    if (!mongoose.Types.ObjectId.isValid(String(query.classId))) {
      throw new ApiError(400, "Invalid class filter");
    }

    filter.classId = query.classId;
  }

  if (query.classIds) {
    const classIds = String(query.classIds)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (
      classIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
    ) {
      throw new ApiError(400, "Invalid class IDs filter");
    }

    filter.classId = { $in: classIds };
  }

  if (query.status) {
    if (!STUDENT_STATUSES.has(query.status)) {
      throw new ApiError(400, "Invalid student status filter");
    }

    filter.status = query.status;
  }

  if (query.search?.trim()) {
    const search = escapeRegex(query.search.trim());
    const searchRegex = { $regex: search, $options: "i" };

    filter.$or = [
      { firstName: searchRegex },
      { middleName: searchRegex },
      { lastName: searchRegex },
      { admissionNumber: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ];
  }

  return Student.find(filter)
    .populate("classId", "name level")
    .populate({
      path: "parentIds",
      populate: {
        path: "userId",
        select: "firstName lastName email phone",
      },
    })
    .sort({ createdAt: -1 });
}

/**
 * GET ONE STUDENT
 */
export async function getStudentById(id, schoolId) {
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    throw new ApiError(404, "Student not found");
  }

  const student = await getPopulatedStudent(id, schoolId);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
}

/**
 * UPDATE STUDENT
 *
 * Updates only supplied fields and synchronizes the linked account.
 * Profile updates do not reset student passwords.
 */
export async function updateStudent(id, payload, schoolId) {
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    throw new ApiError(404, "Student not found");
  }

  const student = await Student.findOne({
    _id: id,
    schoolId,
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const input = { ...payload };

  if (input.admissionNumber !== undefined) {
    input.admissionNumber = normalizeAdmissionNumber(
      input.admissionNumber
    );

    if (!input.admissionNumber) {
      throw new ApiError(400, "Admission number is required");
    }

    const duplicate = await Student.findOne({
      schoolId,
      admissionNumber: input.admissionNumber,
      _id: { $ne: student._id },
    }).select("_id");

    if (duplicate) {
      throw new ApiError(
        409,
        "Another student already uses this admission number"
      );
    }
  }

  if (input.classId !== undefined) {
    student.classId = await validateClassId(
      input.classId,
      schoolId
    );
  }

  let updatedParentIds;

  if (input.parentIds !== undefined) {
    updatedParentIds = await validateParentIds(
      input.parentIds,
      schoolId
    );

    student.parentIds = updatedParentIds;
  }

  for (const field of STUDENT_FIELDS) {
    if (input[field] === undefined) continue;

    if (field === "admissionNumber") {
      student[field] = input[field];
    } else if (field === "dateOfBirth") {
      student[field] = input[field] || null;
    } else if (field === "enrollmentDate") {
      student[field] = input[field] || student.enrollmentDate;
    } else {
      student[field] = input[field];
    }
  }

  if (input.isActive !== undefined) {
    const value = input.isActive;

    if (value === true || value === "true") {
      student.status = "active";
    } else if (value === false || value === "false") {
      student.status = "inactive";
    } else {
      throw new ApiError(400, "Invalid isActive value");
    }
  }

  if (input.status !== undefined) {
    if (!STUDENT_STATUSES.has(input.status)) {
      throw new ApiError(400, "Invalid student status");
    }

    student.status = input.status;
  }

  if (input.entryType !== undefined) {
    if (!ENTRY_TYPES.has(input.entryType)) {
      throw new ApiError(400, "Invalid student entry type");
    }

    student.entryType = input.entryType;
  }

  await student.save();

  if (updatedParentIds !== undefined) {
    await synchronizeParentLinks(
      student._id,
      updatedParentIds,
      schoolId
    );
  }

  await synchronizeStudentAccountStatus(student);

  const updatedStudent = await getPopulatedStudent(
    student._id,
    schoolId
  );

  if (!updatedStudent) {
    throw new ApiError(404, "Student not found after update");
  }

  return updatedStudent;
}

/**
 * DELETE STUDENT
 *
 * Preserves the existing hard-delete behavior and disables
 * any linked student login before removing the student.
 */
export async function deleteStudent(id, schoolId) {
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    throw new ApiError(404, "Student not found");
  }

  const student = await Student.findOne({
    _id: id,
    schoolId,
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  await User.updateMany(
    {
      schoolId,
      studentId: student._id,
      role: STUDENT_ROLE,
    },
    {
      $set: { isActive: false },
    }
  );

  await Parent.updateMany(
    {
      schoolId,
      studentIds: student._id,
    },
    {
      $pull: { studentIds: student._id },
    }
  );

  await Student.deleteOne({
    _id: student._id,
    schoolId,
  });

  return { deleted: true };
}

/**
 * BULK UPSERT STUDENTS
 *
 * - Validates each row independently.
 * - Does not reset existing student passwords.
 * - Creates missing accounts when student login is enabled.
 * - Returns credentials only for newly created accounts.
 * - Rolls back newly created accounts if that row fails.
 */
export async function bulkUpsertStudents(rows, schoolId) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new ApiError(400, "At least one student row is required");
  }

  const school = await getSchool(schoolId);

  let created = 0;
  let updated = 0;
  let failed = 0;

  const results = [];

  for (const row of rows) {
    let student;
    let account;
    let isNewStudent = false;
    let action;

    try {
      const input = validateStudentInput(row);

      const classId = await validateClassId(
        input.classId,
        schoolId
      );

      const parentIds = await validateParentIds(
        input.parentIds || [],
        schoolId
      );

      student = await Student.findOne({
        schoolId,
        admissionNumber: input.admissionNumber,
      });

      if (student) {
        // Update only the fields that the import supplied.
        student.firstName = input.firstName;
        student.lastName = input.lastName;

        if (input.middleName !== undefined) {
          student.middleName = input.middleName || "";
        }

        if (input.gender !== undefined) {
          student.gender = input.gender;
        }

        if (input.dateOfBirth !== undefined) {
          student.dateOfBirth = input.dateOfBirth || null;
        }

        if (input.phone !== undefined) {
          student.phone = input.phone || "";
        }

        if (input.entryType !== undefined) {
          student.entryType = input.entryType;
        }

        if (input.status !== undefined) {
          student.status = input.status;
        }

        student.classId = classId;

        if (input.parentIds !== undefined) {
          student.parentIds = parentIds;
        }

        await student.save();

        if (input.parentIds !== undefined) {
          await synchronizeParentLinks(
            student._id,
            parentIds,
            schoolId
          );
        }

        await synchronizeStudentAccountStatus(student);

        action = "updated";
        updated++;
      } else {
        student = await Student.create(
          buildStudentDocument(
            input,
            schoolId,
            classId,
            parentIds
          )
        );

        isNewStudent = true;
        action = "created";
        created++;
      }

      account = await createStudentLoginAccount(
        student,
        school
      );

      if (isNewStudent && parentIds.length) {
        await linkStudentToParents(
          student._id,
          parentIds,
          schoolId
        );
      }

      results.push({
        admissionNumber: student.admissionNumber,
        student: `${student.firstName} ${student.lastName}`.trim(),
        action,
        loginAccount: {
          enabled: account.enabled,
          created: account.created,
        },
        loginCredentials: account.credentials,
      });
    } catch (error) {
      // Roll back a login account only if this row created it.
      // Never delete an existing student's account or student record.
      if (isNewStudent && student?._id) {
        if (account?.created && account?.userId) {
          await User.deleteOne({
            _id: account.userId,
            schoolId,
            studentId: student._id,
            role: STUDENT_ROLE,
          }).catch(() => {});
        }

        await Parent.updateMany(
          {
            schoolId,
            studentIds: student._id,
          },
          {
            $pull: { studentIds: student._id },
          }
        ).catch(() => {});

        await Student.deleteOne({
          _id: student._id,
          schoolId,
        }).catch(() => {});

        created--;
      }

      failed++;

      results.push({
        admissionNumber: row?.admissionNumber || "",
        student: `${row?.firstName || ""} ${
          row?.lastName || ""
        }`.trim(),
        action: "failed",
        error:
          error?.code === 11000
            ? "A student with this admission number already exists"
            : error?.message || "Unable to process student",
      });
    }
  }

  return {
    created,
    updated,
    failed,
    results,
  };
}
