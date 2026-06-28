import { Teacher } from "./teacher.model.js";
import { User } from "../users/user.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { ClassModel } from "../classes/class.model.js";
import { ApiError } from "../../utils/apiError.js";
import { hashPassword } from "../../utils/hash.js";

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

async function validateClassIds(
classIds,
schoolId
) {
if (!classIds?.length) return;

const count =
await ClassModel.countDocuments({
_id: { $in: classIds },
schoolId,
});

if (count !== classIds.length) {
throw new ApiError(
400,
"One or more class IDs are invalid"
);
}
}


/**
 * ==================================================
 * CREATE
 * ==================================================
 */
export async function createTeacher(
  payload,
  schoolId
) {
  const existingUser =
    await User.findOne({
      email:
        payload.email
          .toLowerCase(),
    });

  if (existingUser) {
    throw new ApiError(
      400,
      "A user with this email already exists"
    );
  }

  if (payload.employeeId) {
    const existingTeacher =
      await Teacher.findOne({
        schoolId,
        employeeId:
          payload.employeeId,
      });

    if (existingTeacher) {
      throw new ApiError(
        400,
        "A teacher with this employee ID already exists"
      );
    }
  }

  await validateSubjectIds(
    payload.subjectIds,
    schoolId
  );

  await validateClassIds(
    payload.classIds,
    schoolId
  );

  const passwordHash =
    await hashPassword(
      payload.password
    );

  const user =
    await User.create({
      schoolId,

      role: "teacher",

      firstName:
        payload.firstName,

      lastName:
        payload.lastName,

      email:
        payload.email
          .toLowerCase(),

      phone:
        payload.phone,

      passwordHash,

      isActive:
        payload.isActive ??
        payload.status ===
          "active",
    });

  const teacher =
    await Teacher.create({
      schoolId,

      userId: user._id,

      employeeId:
        payload.employeeId ||
        "",

      qualification:
        payload.qualification ||
        "",

      middleName:
        payload.middleName ||
        "",

      gender:
        payload.gender ||
        "male",

      dateOfBirth:
        payload.dateOfBirth ||
        null,

      address:
        payload.address ||
        "",

      designation:
        payload.designation ||
        "",

      employmentDate:
        payload.employmentDate ||
        null,

      employmentType:
        payload.employmentType ||
        "full_time",

      emergencyName:
        payload.emergencyName ||
        "",

      emergencyPhone:
        payload.emergencyPhone ||
        "",

      bloodGroup:
        payload.bloodGroup ||
        "",

      genotype:
        payload.genotype ||
        "",

      nin:
        payload.nin ||
        "",

      photo:
        payload.photo ||
        "",

      subjectIds:
        payload.subjectIds ||
        [],

      classIds:
        payload.classIds ||
        [],

      status:
        payload.status ||
        (
          payload.isActive
            ? "active"
            : "inactive"
        ),
    });

  return teacherPopulate(
    Teacher.findById(
      teacher._id
    )
  );
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
  if (
    payload.classIds !== undefined
  ) {
    await validateClassIds(
      payload.classIds,
      schoolId
    );

    teacher.classIds =
      payload.classIds;
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

/**

* ==================================================
* BULK UPSERT
* ==================================================
  */
export async function bulkUpsertTeachers(
  rows = [],
  schoolId
) {
  let created = 0;
  let updated = 0;
  let failed = 0;

  const results = [];

  for (const row of rows) {
    try {
      const email = (
        row.email || ""
      )
        .toLowerCase()
        .trim();

      if (!email) {
        throw new Error(
          "Email missing"
        );
      }

      const user =
        await User.findOne({
          email,
          schoolId,
        });

      /* =========================
         UPDATE FLOW
      ========================= */
      if (user) {
        user.firstName =
          row.firstName ||
          user.firstName;

        user.lastName =
          row.lastName ||
          user.lastName;

        user.phone =
          row.phone ||
          user.phone;

        if (row.isActive !== undefined) {
          user.isActive =
            row.isActive;
        }

        if (row.status) {
          user.isActive =
            row.status ===
            "active";
        }

        await user.save();

        const teacher =
          await Teacher.findOne({
            userId: user._id,
            schoolId,
          });

        if (teacher) {
          teacher.employeeId =
            row.employeeId ||
            teacher.employeeId;

          teacher.qualification =
            row.qualification ||
            teacher.qualification;

          teacher.designation =
            row.designation ||
            teacher.designation;

          teacher.gender =
            row.gender ||
            teacher.gender;

          teacher.address =
            row.address ||
            teacher.address;

          teacher.dateOfBirth =
            row.dateOfBirth ||
            teacher.dateOfBirth;

          teacher.employmentDate =
            row.employmentDate ||
            teacher.employmentDate;

          teacher.employmentType =
            row.employmentType ||
            teacher.employmentType;

          teacher.maritalStatus =
            row.maritalStatus ||
            teacher.maritalStatus;

          teacher.stateOfOrigin =
            row.stateOfOrigin ||
            teacher.stateOfOrigin;

          teacher.lga =
            row.lga ||
            teacher.lga;

          teacher.nationality =
            row.nationality ||
            teacher.nationality;

          teacher.staffCategory =
            row.staffCategory ||
            teacher.staffCategory;

          teacher.emergencyName =
            row.emergencyName ||
            teacher.emergencyName;

          teacher.emergencyPhone =
            row.emergencyPhone ||
            teacher.emergencyPhone;

          teacher.bloodGroup =
            row.bloodGroup ||
            teacher.bloodGroup;

          teacher.genotype =
            row.genotype ||
            teacher.genotype;

          teacher.nin =
            row.nin ||
            teacher.nin;

          teacher.photo =
            row.photo ||
            teacher.photo;

          teacher.status =
            row.status ||
            teacher.status;

          /* SUBJECTS */
          if (
            Array.isArray(
              row.subjectIds
            )
          ) {
            teacher.subjectIds =
              row.subjectIds;
          }

          /* CLASSES */
          if (
            Array.isArray(
              row.classIds
            )
          ) {
            teacher.classIds =
              row.classIds;
          }

          await teacher.save();
        }

        updated++;

        results.push({
          email,
          action: "updated",
        });
      }

      /* =========================
         CREATE FLOW
      ========================= */
      else {
        const passwordHash =
          await hashPassword(
            row.password ||
              "teacher123"
          );

        const newUser =
          await User.create({
            schoolId,
            role: "teacher",
            firstName:
              row.firstName || "",
            lastName:
              row.lastName || "",
            email,
            phone:
              row.phone || "",
            passwordHash,
            isActive:
              row.status !==
              "inactive",
          });

        await Teacher.create({
          schoolId,
          userId: newUser._id,

          employeeId:
            row.employeeId || "",

          qualification:
            row.qualification || "",

          designation:
            row.designation || "",

          gender:
            row.gender || "male",

          address:
            row.address || "",

          dateOfBirth:
            row.dateOfBirth || null,

          employmentDate:
            row.employmentDate ||
            null,

          employmentType:
            row.employmentType ||
            "full_time",

          maritalStatus:
            row.maritalStatus ||
            "",

          stateOfOrigin:
            row.stateOfOrigin ||
            "",

          lga:
            row.lga || "",

          nationality:
            row.nationality ||
            "Nigerian",

          staffCategory:
            row.staffCategory ||
            "",

          emergencyName:
            row.emergencyName ||
            "",

          emergencyPhone:
            row.emergencyPhone ||
            "",

          bloodGroup:
            row.bloodGroup ||
            "",

          genotype:
            row.genotype ||
            "",

          nin:
            row.nin || "",

          photo:
            row.photo || "",

          subjectIds:
            Array.isArray(
              row.subjectIds
            )
              ? row.subjectIds
              : [],

          classIds:
            Array.isArray(
              row.classIds
            )
              ? row.classIds
              : [],

          status:
            row.status ||
            "active",
        });

        created++;

        results.push({
          email,
          action: "created",
        });
      }
    } catch (error) {
      failed++;

      results.push({
        email:
          row.email ||
          "unknown",
        action: "failed",
        error:
          error.message,
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