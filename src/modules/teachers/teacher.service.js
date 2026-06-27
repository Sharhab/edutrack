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

function teacherPopulate(query) {
return query
.populate(
"userId",
"firstName lastName email phone isActive role"
)
.populate(
"subjectIds",
"name code"
)
.populate(
"classIds",
"name level"
)
.populate(
"classTeacherOf",
"name level"
);
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
  export async function getTeacherById(
  id,
  schoolId
  ) {
  const teacher =
  await teacherPopulate(
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

return teacher;
}

function teacherPopulate(query) {
  return query
    .populate(
      "userId",
      "firstName lastName email phone isActive role"
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
* UPDATE
* ==================================================
  */
  export async function updateTeacher(
  id,
  payload,
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

const user =
await User.findOne({
_id: teacher.userId,
schoolId,
});

if (!user) {
throw new ApiError(
404,
"Teacher user not found"
);
}

if (
payload.employeeId &&
payload.employeeId !==
teacher.employeeId
) {
const exists =
await Teacher.findOne({
schoolId,

    employeeId:
      payload.employeeId,

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

if (
payload.subjectIds !==
undefined
) {
await validateSubjectIds(
payload.subjectIds,
schoolId
);

```
teacher.subjectIds =
  payload.subjectIds;
```

}

if (
payload.classIds !==
undefined
) {
await validateClassIds(
payload.classIds,
schoolId
);

```
teacher.classIds =
  payload.classIds;
```

}

if (
payload.firstName !==
undefined
) {
user.firstName =
payload.firstName;
}

if (
payload.lastName !==
undefined
) {
user.lastName =
payload.lastName;
}

if (
payload.phone !==
undefined
) {
user.phone =
payload.phone;
}

if (
payload.isActive !==
undefined
) {
user.isActive =
payload.isActive;
}

if (
payload.employeeId !==
undefined
) {
teacher.employeeId =
payload.employeeId;
}

if (
payload.qualification !==
undefined
) {
teacher.qualification =
payload.qualification;
}

if (
payload.status !==
undefined
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
export async function bulkUpsertTeachers(rows = [], schoolId) {
  let created = 0;
  let updated = 0;
  let failed = 0;

  const results = [];

  for (const row of rows) {
    try {
      const email = (row.email || "").toLowerCase().trim();

      if (!email) throw new Error("Email missing");

      const user = await User.findOne({ email, schoolId });

      // =========================
      // UPDATE FLOW
      // =========================
      if (user) {
        user.firstName = row.firstName || user.firstName;
        user.lastName = row.lastName || user.lastName;
        user.phone = row.phone || user.phone;

        await user.save();

        const teacher = await Teacher.findOne({
          userId: user._id,
          schoolId,
        });

        if (teacher) {
          teacher.employeeId = row.employeeId || teacher.employeeId;
          teacher.qualification = row.qualification || teacher.qualification;
          teacher.status = row.status || teacher.status;

          // SAFE ARRAY HANDLING
          if (Array.isArray(row.subjectIds)) {
            teacher.subjectIds = row.subjectIds;
          }

          if (Array.isArray(row.classIds)) {
            teacher.classIds = row.classIds;
          }

          await teacher.save();
        }

        updated++;

        results.push({
          email,
          action: "updated",
        });
      }

      // =========================
      // CREATE FLOW
      // =========================
      else {
        const passwordHash = await hashPassword(
          row.password || "teacher123"
        );

        const newUser = await User.create({
          schoolId,
          role: "teacher",
          firstName: row.firstName || "",
          lastName: row.lastName || "",
          email,
          phone: row.phone || "",
          passwordHash,
          isActive: row.status !== "inactive",
        });

        await Teacher.create({
          schoolId,
          userId: newUser._id,
          employeeId: row.employeeId || "",
          qualification: row.qualification || "",
          subjectIds: Array.isArray(row.subjectIds)
            ? row.subjectIds
            : [],
          classIds: Array.isArray(row.classIds)
            ? row.classIds
            : [],
          status: row.status || "active",
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
        email: row.email || "unknown",
        action: "failed",
        error: error.message,
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