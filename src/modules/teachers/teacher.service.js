import { randomUUID, randomBytes } from "node:crypto";
import { Teacher } from "./teacher.model.js";
import { User } from "../users/user.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { ClassModel } from "../classes/class.model.js";
import { ApiError } from "../../utils/apiError.js";
import {
  hashPassword,
  comparePassword,
} from "../../utils/hash.js";
import {
  sendTeacherWelcomeEmail,
} from "../../services/email.service.js";

import { School } from "../schools/school.model.js";

async function validateSubjectIds(
  subjectIds,
  schoolId
) {
  if (!subjectIds?.length) return;

  const count =
    await SubjectModel.countDocuments({
      _id: { $in: subjectIds },
      schoolId,
    });

  if (count !== subjectIds.length) {
    throw new ApiError(
      400,
      "One or more subject IDs are invalid"
    );
  }
}


async function validateClassIds(classIds, schoolId) {
  const uniqueClassIds = [
    ...new Set((classIds || []).map(String)),
  ];

  if (!uniqueClassIds.length) {
    throw new ApiError(
      400,
      "Assign at least one class to this teacher"
    );
  }

  const count = await ClassModel.countDocuments({
    _id: { $in: uniqueClassIds },
    schoolId,
  });

  if (count !== uniqueClassIds.length) {
    throw new ApiError(
      400,
      "One or more selected classes do not belong to this school"
    );
  }

  return uniqueClassIds;
}



/**
 * ==================================================
 * CREATE
 * ==================================================
 */

export async function createTeacher(payload, schoolId) {
  const email = String(payload.email || "")
    .trim()
    .toLowerCase();

  const firstName = String(payload.firstName || "").trim();
  const lastName = String(payload.lastName || "").trim();

  if (firstName.length < 2 || lastName.length < 2) {
    throw new ApiError(
      400,
      "First name and last name are required"
    );
  }

  // Prevent duplicate email accounts across the platform.
  if (email) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ApiError(
        400,
        "A user with this email already exists"
      );
    }
  }

  // Generate Employee ID if the administrator did not provide one.
  const employeeId =
    String(payload.employeeId || "").trim() ||
    await createUniqueEmployeeId(schoolId);

  const existingTeacher = await Teacher.findOne({
    schoolId,
    employeeId,
  });

  if (existingTeacher) {
    throw new ApiError(
      400,
      "A teacher with this employee ID already exists"
    );
  }

  const classIds = await validateClassIds(
    payload.classIds,
    schoolId
  );

  // Generate a strong temporary password.
  const temporaryPassword = randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(temporaryPassword);

  const isActive =
    payload.isActive ??
    payload.status !== "inactive";

  let user;

  try {
    user = await User.create({
      schoolId,
      role: "teacher",
      firstName,
      lastName,
      ...(email ? { email } : {}),
      passwordHash,
      mustChangePassword: true,
      isActive,
    });

    const teacher = await Teacher.create({
      schoolId,
      userId: user._id,

      employeeId,
      qualification: payload.qualification || "",
      designation: payload.designation || "",
      middleName: payload.middleName || "",

      gender: payload.gender || "male",
      dateOfBirth: payload.dateOfBirth || null,
      address: payload.address || "",

      employmentDate: payload.employmentDate || null,
      employmentType: payload.employmentType || "full_time",

      maritalStatus: payload.maritalStatus || "",
      stateOfOrigin: payload.stateOfOrigin || "",
      lga: payload.lga || "",
      nationality: payload.nationality || "Nigerian",
      staffCategory: payload.staffCategory || "",

      emergencyName: payload.emergencyName || "",
      emergencyPhone: payload.emergencyPhone || "",

      bloodGroup: payload.bloodGroup || "",
      genotype: payload.genotype || "",
      nin: payload.nin || "",
      photo: payload.photo || "",

      subjectIds: [],
      classIds,

      status: payload.status || "active",
      isActive,
    });

    // Send a welcome notification, but never email the password
    // through this existing welcome-email function.
    if (email) {
      try {
        const school = await School.findById(schoolId)
          .select("name slug");

        const loginUrl = school?.slug
          ? `https://${school.slug}.edutrack.cloud/login`
          : `${process.env.FRONTEND_URL || ""}/login`;

        await sendTeacherWelcomeEmail({
          firstName,
          email,
          schoolName: school?.name || "Your School",
          loginUrl,
          teacherId: teacher._id.toString(),
        });
      } catch (emailError) {
        console.error(
          "Teacher welcome email failed:",
          emailError.message
        );
      }
    }

    const populatedTeacher = await teacherPopulate(
      Teacher.findById(teacher._id)
    );

    return {
      ...populatedTeacher.toObject(),

      // Display once to the administrator for credential delivery.
      loginCredentials: {
        employeeId,
        email: email || null,
        temporaryPassword,
        mustChangePassword: true,
      },
    };
  } catch (error) {
    // Avoid leaving an orphaned user account.
    if (user?._id) {
      await User.deleteOne({
        _id: user._id,
        schoolId,
        role: "teacher",
      }).catch(() => {});
    }

    throw error;
  }
}

/**
 * ==================================================
 * LIST
 * ==================================================
 */
export async function listTeachers(
  schoolId
) {
  return teacherPopulate(
    Teacher.find({
      schoolId,
    }).sort({
      createdAt: -1,
    })
  );
}

/**
 * ==================================================
 * GET
 * ==================================================
 */
function teacherPopulate(query) {
  return query
    .populate(
      "userId",
      `
        firstName
        lastName
        email
        phone
        isActive
        role
      `
    )
    .populate(
      "subjectIds",
      "name code"
    )
    .populate(
      "classIds",
      "name level arm"
    )
    .populate(
      "classTeacherOf",
      "name level arm"
    );
}

/**
 * ==================================================
 * GET SINGLE TEACHER
 * ==================================================
 */
export async function getTeacherById(
  id,
  schoolId
) {
  const teacher = await teacherPopulate(
    Teacher.findOne({
      _id: id,
      schoolId,
    })
  );

  if (!teacher) {
    throw new ApiError(
      404,
      "Teacher not found"
    );
  }

  const user = teacher.userId || {};

  return {
    _id: teacher._id,

    schoolId: teacher.schoolId,

    userId: teacher.userId,

    // USER INFO
    firstName:
      user.firstName ||
      teacher.firstName ||
      "",

    middleName:
      teacher.middleName || "",

    lastName:
      user.lastName ||
      teacher.lastName ||
      "",

    email:
      user.email ||
      teacher.email ||
      "",

    phone:
      user.phone ||
      teacher.phone ||
      "",

    // EMPLOYMENT
    employeeId:
      teacher.employeeId || "",

    qualification:
      teacher.qualification || "",

    designation:
      teacher.designation || "",

    employmentType:
      teacher.employmentType ||
      "full_time",

    employmentDate:
      teacher.employmentDate,

    // PERSONAL
    gender:
      teacher.gender ||
      "male",

    dateOfBirth:
      teacher.dateOfBirth,

    address:
      teacher.address || "",

    // ASSIGNMENTS
    subjectIds:
      teacher.subjectIds || [],

    classIds:
      teacher.classIds || [],

    assignments:
      teacher.assignments || [],

    classTeacherOf:
      teacher.classTeacherOf,

    // STATUS
    status:
      teacher.status ||
      "active",

    isActive:
      user.isActive ??
      teacher.isActive ??
      teacher.status ===
        "active",

    // TIMESTAMPS
    createdAt:
      teacher.createdAt,

    updatedAt:
      teacher.updatedAt,
  };
}

/**
 * ==================================================
 * UPDATE
 * ==================================================
 */
export async function updateTeacher(
  id,
  payload,
  schoolId
) {
  const teacher = await Teacher.findOne({
    _id: id,
    schoolId,
  });

  if (!teacher) {
    throw new ApiError(
      404,
      "Teacher not found"
    );
  }

  const user = await User.findOne({
    _id: teacher.userId,
    schoolId,
  });

  if (!user) {
    throw new ApiError(
      404,
      "Teacher user not found"
    );
  }

  /* =========================
     EMPLOYEE ID VALIDATION
  ========================= */
  if (
    payload.employeeId &&
    payload.employeeId !== teacher.employeeId
  ) {
    const exists = await Teacher.findOne({
      schoolId,
      employeeId: payload.employeeId,
      _id: {
        $ne: id,
      },
    });

    if (exists) {
      throw new ApiError(
        400,
        "Another teacher already uses this employee ID"
      );
    }
  }

  /* =========================
     SUBJECTS
  ========================= */
  if (
    payload.subjectIds !== undefined
  ) {
    await validateSubjectIds(
      payload.subjectIds,
      schoolId
    );

    teacher.subjectIds =
      payload.subjectIds;
  }

  /* =========================
     CLASSES
  ========================= */
  
/* =========================
   CLASS ASSIGNMENT
========================= */
if (payload.classIds !== undefined) {
  const classIds = await validateClassIds(
    payload.classIds,
    schoolId
  );

  teacher.classIds = classIds;
}


  /* =========================
     USER FIELDS
  ========================= */
  if (
    payload.firstName !== undefined
  ) {
    user.firstName =
      payload.firstName;
  }

  if (
    payload.lastName !== undefined
  ) {
    user.lastName =
      payload.lastName;
  }

  if (
    payload.email !== undefined
  ) {
    user.email =
      payload.email;
  }

  if (
    payload.phone !== undefined
  ) {
    user.phone =
      payload.phone;
  }

  if (
    payload.isActive !== undefined
  ) {
    user.isActive =
      payload.isActive;
  }

  /* =========================
     TEACHER FIELDS
  ========================= */
  if (
    payload.employeeId !== undefined
  ) {
    teacher.employeeId =
      payload.employeeId;
  }

  if (
    payload.qualification !== undefined
  ) {
    teacher.qualification =
      payload.qualification;
  }

  if (
    payload.designation !== undefined
  ) {
    teacher.designation =
      payload.designation;
  }

  if (
    payload.gender !== undefined
  ) {
    teacher.gender =
      payload.gender;
  }

  if (
    payload.address !== undefined
  ) {
    teacher.address =
      payload.address;
  }

  if (
    payload.dateOfBirth !== undefined
  ) {
    teacher.dateOfBirth =
      payload.dateOfBirth;
  }

  if (
    payload.employmentDate !== undefined
  ) {
    teacher.employmentDate =
      payload.employmentDate;
  }

  if (
    payload.employmentType !== undefined
  ) {
    teacher.employmentType =
      payload.employmentType;
  }

  if (
    payload.maritalStatus !== undefined
  ) {
    teacher.maritalStatus =
      payload.maritalStatus;
  }

  if (
    payload.stateOfOrigin !== undefined
  ) {
    teacher.stateOfOrigin =
      payload.stateOfOrigin;
  }

  if (
    payload.lga !== undefined
  ) {
    teacher.lga =
      payload.lga;
  }

  if (
    payload.nationality !== undefined
  ) {
    teacher.nationality =
      payload.nationality;
  }

  if (
    payload.staffCategory !== undefined
  ) {
    teacher.staffCategory =
      payload.staffCategory;
  }

  if (
    payload.emergencyName !== undefined
  ) {
    teacher.emergencyName =
      payload.emergencyName;
  }

  if (
    payload.emergencyPhone !== undefined
  ) {
    teacher.emergencyPhone =
      payload.emergencyPhone;
  }

  if (
    payload.bloodGroup !== undefined
  ) {
    teacher.bloodGroup =
      payload.bloodGroup;
  }

  if (
    payload.genotype !== undefined
  ) {
    teacher.genotype =
      payload.genotype;
  }

  if (
    payload.nin !== undefined
  ) {
    teacher.nin =
      payload.nin;
  }

  if (
    payload.photo !== undefined
  ) {
    teacher.photo =
      payload.photo;
  }

  /* =========================
     STATUS
  ========================= */
  if (
    payload.status !== undefined
  ) {
    teacher.status =
      payload.status;

    user.isActive =
      payload.status ===
      "active";
  }

  await user.save();
  await teacher.save();

  return teacherPopulate(
    Teacher.findById(
      teacher._id
    )
  );
}

/**
 * ==================================================
 * DELETE
 * ==================================================
 */
export async function deleteTeacher(
  id,
  schoolId
) {
  const teacher =
    await Teacher.findOne({
      _id: id,
      schoolId,
    });

  if (!teacher) {
    throw new ApiError(
      404,
      "Teacher not found"
    );
  }

  await User.findOneAndDelete({
    _id: teacher.userId,
    schoolId,
  });

  await Teacher.deleteOne({
    _id: id,
  });

  return {
    deleted: true,
  };
}

function generateEmployeeId() {
  return `TCH-${randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase()}`;
}

async function createUniqueEmployeeId(schoolId) {
  // Check the school's existing teacher records before using an ID.
  for (let attempt = 0; attempt < 5; attempt++) {
    const employeeId = generateEmployeeId();

    const exists = await Teacher.exists({
      schoolId,
      employeeId,
    });

    if (!exists) return employeeId;
  }

  throw new Error("Could not generate a unique Employee ID. Please try again.");
}


export async function bulkUpsertTeachers(rows = [], schoolId) {
  if (!Array.isArray(rows) || !rows.length) {
    throw new ApiError(400, "No teachers supplied");
  }

  let created = 0;
  let updated = 0;
  let failed = 0;
  const results = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index] || {};
    let createdUserId = null;

    try {
      const firstName = String(row.firstName || "").trim();
      const middleName = String(row.middleName || "").trim();
      const lastName = String(row.lastName || "").trim();
      const email = String(row.email || "").trim().toLowerCase();
      const phone = String(row.phone || "").trim();
      const password = String(row.password || "");

      if (firstName.length < 2) {
        throw new Error("First name must contain at least 2 characters");
      }

      if (lastName.length < 2) {
        throw new Error("Last name must contain at least 2 characters");
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Enter a valid email address or leave it blank");
      }

      if (password.length < 6) {
        throw new Error("Password must contain at least 6 characters");
      }

      // Classes are now the only assignment required here.
      const classIds = await validateClassIds(
        row.classIds,
        schoolId
      );

      const status =
        row.status === "inactive" || row.isActive === false
          ? "inactive"
          : "active";

      let existingUser = null;

      if (email) {
        existingUser = await User.findOne({
          email,
          schoolId,
          role: "teacher",
        });
      }

      const teacherFields = {
        middleName,
        phone,
        qualification: String(row.qualification || "").trim(),
        designation: String(row.designation || "").trim(),
        gender: row.gender === "female" ? "female" : "male",
        dateOfBirth: row.dateOfBirth || null,
        address: String(row.address || "").trim(),
        maritalStatus: String(row.maritalStatus || "").trim(),
        stateOfOrigin: String(row.stateOfOrigin || "").trim(),
        lga: String(row.lga || "").trim(),
        nationality: String(row.nationality || "Nigerian").trim(),
        employmentDate: row.employmentDate || null,
        employmentType: row.employmentType || "full_time",
        emergencyName: String(row.emergencyName || "").trim(),
        emergencyPhone: String(row.emergencyPhone || "").trim(),
        bloodGroup: String(row.bloodGroup || "").trim(),
        genotype: String(row.genotype || "").trim(),
        nin: String(row.nin || "").trim(),
        classIds,
        status,
        isActive: status === "active",
      };

      // Update an existing teacher account in this school.
      if (existingUser) {
        const teacher = await Teacher.findOne({
          userId: existingUser._id,
          schoolId,
        });

        if (!teacher) {
          throw new Error(
            "This email belongs to an account without a teacher profile"
          );
        }

        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        existingUser.isActive = status === "active";
        existingUser.passwordHash = await hashPassword(password);
        existingUser.passwordChangedAt = new Date();

        if (phone) existingUser.phone = phone;

        Object.assign(teacher, teacherFields);

        if (!teacher.employeeId) {
          teacher.employeeId = await createUniqueEmployeeId(schoolId);
        }

        await existingUser.save();
        await teacher.save();

        updated++;

        results.push({
          row: index + 1,
          email,
          employeeId: teacher.employeeId,
          action: "updated",
        });

        continue;
      }

      // Do not allow an email already used by another account.
      if (email) {
        const existingAccount = await User.findOne({ email });

        if (existingAccount) {
          throw new Error(
            "This email is already registered to another account"
          );
        }
      }

      const employeeId = await createUniqueEmployeeId(schoolId);
      const passwordHash = await hashPassword(password);

      const userData = {
        schoolId,
        role: "teacher",
        firstName,
        lastName,
        passwordHash,
        isActive: status === "active",
      };

      if (email) userData.email = email;
      if (phone) userData.phone = phone;

      const newUser = await User.create(userData);
      createdUserId = newUser._id;

      const newTeacher = await Teacher.create({
        schoolId,
        userId: newUser._id,
        employeeId,

        ...teacherFields,

        // Do not manually assign subjects.
        // Subject access is derived from classIds.
        subjectIds: [],
      });

      createdUserId = null;
      created++;

      results.push({
        row: index + 1,
        email,
        employeeId: newTeacher.employeeId,
        action: "created",
      });

      if (email) {
        try {
          const school = await School.findById(schoolId)
            .select("name slug");

          const loginUrl = school?.slug
            ? `https://${school.slug}.edutrack.cloud/login`
            : `${process.env.FRONTEND_URL || ""}/login`;

          await sendTeacherWelcomeEmail({
            firstName,
            email,
            schoolName: school?.name || "Your School",
            loginUrl,
            teacherId: newTeacher._id.toString(),
          });
        } catch (emailError) {
          console.error(
            `Teacher welcome email failed for ${email}:`,
            emailError.message
          );
        }
      }
    } catch (error) {
      if (createdUserId) {
        await User.deleteOne({
          _id: createdUserId,
          schoolId,
          role: "teacher",
        }).catch(() => {});
      }

      failed++;

      results.push({
        row: index + 1,
        email: String(row.email || "").trim(),
        action: "failed",
        error: error.message || "Unable to process this teacher",
      });
    }
  }

  return {
    total: rows.length,
    created,
    updated,
    failed,
    results,
  };
}


/**
 * RESET TEACHER PASSWORD
 * School admins can reset only their own school's teachers.
 */

export async function resetTeacherPassword(
  teacherId,
  schoolId,
  temporaryPassword
) {
  if (
    typeof temporaryPassword !== "string" ||
    temporaryPassword.length < 12 ||
    temporaryPassword.length > 128
  ) {
    throw new ApiError(
      400,
      "Password must contain between 12 and 128 characters"
    );
  }

  const teacher = await Teacher.findOne({
    _id: teacherId,
    schoolId,
  });

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  const user = await User.findOne({
    _id: teacher.userId,
    schoolId,
    role: "teacher",
  });

  if (!user) {
    throw new ApiError(404, "Teacher account not found");
  }

  if (!user.isActive) {
    throw new ApiError(
      400,
      "Cannot reset the password of an inactive teacher"
    );
  }

  const newHash = await hashPassword(temporaryPassword);

  // Verify the hash before saving it.
  const verified = await comparePassword(
    temporaryPassword,
    newHash
  );

  if (!verified) {
    throw new ApiError(
      500,
      "Password verification failed"
    );
  }

  user.passwordHash = newHash;
user.passwordChangedAt = new Date();
user.mustChangePassword = true;

await user.save();
  
  return {
    teacherId: String(teacher._id),
    email: user.email,
    reset: true,
    passwordChangedAt: user.passwordChangedAt,
  };
}
