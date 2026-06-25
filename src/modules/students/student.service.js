import { Student } from "./student.model.js";
import { ClassModel } from "../classes/class.model.js";
import { Parent } from "../parents/parent.model.js";
import { ApiError } from "../../utils/apiError.js";

async function validateClassId(classId, schoolId) {
  const classDoc = await ClassModel.findOne({
    _id: classId,
    schoolId,
  });

  if (!classDoc) {
    throw new ApiError(400, "Selected class is invalid");
  }
}

async function validateParentIds(parentIds, schoolId) {
  if (!parentIds?.length) return;

  const count = await Parent.countDocuments({
    _id: { $in: parentIds },
    schoolId,
  });

  if (count !== parentIds.length) {
    throw new ApiError(400, "One or more parent IDs are invalid");
  }
}

export async function createStudent(payload, schoolId) {
  const existing = await Student.findOne({
    schoolId,
    admissionNumber: payload.admissionNumber,
  });

  if (existing) {
    throw new ApiError(
      400,
      "Student with this admission number already exists"
    );
  }

  // Safe defaults
  payload.parentIds ??= [];
  payload.status ??= "active";
  payload.entryType ??= "new";

  await validateClassId(
    payload.classId,
    schoolId
  );

  await validateParentIds(
    payload.parentIds,
    schoolId
  );

  const student = await Student.create({
    /**
     * SCHOOL
     */
    schoolId,

    /**
     * ADMISSION
     */
    admissionNumber:
      payload.admissionNumber,

    enrollmentDate:
      payload.enrollmentDate ||
      new Date(),

    entryType:
      payload.entryType,

    previousSchool:
      payload.previousSchool || "",

    /**
     * PERSONAL INFORMATION
     */
    firstName:
      payload.firstName,

    middleName:
      payload.middleName || "",

    lastName:
      payload.lastName,

    gender:
      payload.gender || "male",

    dateOfBirth:
      payload.dateOfBirth || null,

    /**
     * LOCATION
     */
    stateOfOrigin:
      payload.stateOfOrigin || "",

    lga:
      payload.lga || "",

    address:
      payload.address || "",

    /**
     * CONTACT
     */
    email:
      payload.email || "",

    phone:
      payload.phone || "",

    /**
     * CLASS
     */
    classId:
      payload.classId,

    /**
     * PARENTS
     */
    parentIds:
      payload.parentIds || [],

    /**
     * EMERGENCY
     */
    emergencyName:
      payload.emergencyName || "",

    emergencyPhone:
      payload.emergencyPhone || "",

    /**
     * HEALTH
     */
    bloodGroup:
      payload.bloodGroup || "",

    genotype:
      payload.genotype || "",

    /**
     * DOCUMENTS
     */
    nin:
      payload.nin || "",

    birthCertificateNo:
      payload.birthCertificateNo || "",

    /**
     * SYSTEM
     */
    status:
      payload.status,

    photo:
      payload.photo || "",
  });

  /**
   * LINK STUDENT TO PARENTS
   */
  if (payload.parentIds?.length) {
    await Parent.updateMany(
      {
        _id: {
          $in: payload.parentIds,
        },
        schoolId,
      },
      {
        $addToSet: {
          studentIds: student._id,
        },
      }
    );
  }

  /**
   * RETURN POPULATED STUDENT
   */
  return Student.findById(student._id)
    .populate(
      "classId",
      "name level"
    )
    .populate({
      path: "parentIds",
      populate: {
        path: "userId",
        select:
          "firstName lastName email phone",
      },
    });
}

export async function listStudents(schoolId, query) {
  const filter = { schoolId };

  if (query.classIds) {
    const classIds = query.classIds
      .split(",")
      .filter(Boolean);

    filter.classId = { $in: classIds };
  }

  return Student.find(filter)
    .populate("classId", "name")
    .sort({ createdAt: -1 });
}

export async function getStudentById(id, schoolId) {
  const student = await Student.findOne({ _id: id, schoolId })
    .populate("classId", "name level")
    .populate({
      path: "parentIds",
      populate: {
        path: "userId",
        select: "firstName lastName email phone",
      },
    });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
}

export async function updateStudent(id, payload, schoolId) {
  const student = await Student.findOne({ _id: id, schoolId });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (
    payload.admissionNumber &&
    payload.admissionNumber !== student.admissionNumber
  ) {
    const existing = await Student.findOne({
      schoolId,
      admissionNumber: payload.admissionNumber,
      _id: { $ne: id },
    });

    if (existing) {
      throw new ApiError(400, "Another student already uses this admission number");
    }
  }

  if (payload.classId !== undefined) {
    await validateClassId(payload.classId, schoolId);
    student.classId = payload.classId;
  }

  if (payload.parentIds !== undefined) {
    await validateParentIds(payload.parentIds, schoolId);

    await Parent.updateMany(
      { studentIds: student._id, schoolId },
      { $pull: { studentIds: student._id } }
    );

    if (payload.parentIds.length) {
      await Parent.updateMany(
        { _id: { $in: payload.parentIds }, schoolId },
        { $addToSet: { studentIds: student._id } }
      );
    }

    student.parentIds = payload.parentIds;
  }

  if (payload.admissionNumber !== undefined) {
    student.admissionNumber = payload.admissionNumber;
  }
  if (payload.firstName !== undefined) student.firstName = payload.firstName;
  if (payload.lastName !== undefined) student.lastName = payload.lastName;
  if (payload.gender !== undefined) student.gender = payload.gender;
  if (payload.dateOfBirth !== undefined) {
    student.dateOfBirth = payload.dateOfBirth || null;
  }
  if (payload.status !== undefined) student.status = payload.status;
  if (payload.enrollmentDate !== undefined) {
    student.enrollmentDate = payload.enrollmentDate || student.enrollmentDate;
  }
  if (payload.photo !== undefined) student.photo = payload.photo;

  await student.save();

  return Student.findById(student._id)
    .populate("classId", "name level")
    .populate({
      path: "parentIds",
      populate: {
        path: "userId",
        select: "firstName lastName email phone",
      },
    });
}

export async function deleteStudent(id, schoolId) {
  const student = await Student.findOne({ _id: id, schoolId });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  await Parent.updateMany(
    { studentIds: student._id, schoolId },
    { $pull: { studentIds: student._id } }
  );

  await Student.deleteOne({ _id: id });

  return { deleted: true };
}
/**
 * BULK UPSERT STUDENTS (MIGRATION SAFE)
 */

/**
 * =========================================
 * RESOLVE CLASS BY NAME (ENTERPRISE SAFE)
 * =========================================
 */
async function resolveClassId({
  schoolId,
  className,
  sessionId,
  termId,
}) {
  if (!className) {
    throw new ApiError(400, "className is required");
  }

  let cls = await ClassModel.findOne({
    schoolId,
    name: className.trim(),
  });

  // OPTIONAL: AUTO-CREATE CLASS IF NOT FOUND
  if (!cls) {
    cls = await ClassModel.create({
      schoolId,
      name: className.trim(),
      slug: className.toLowerCase().replace(/\s+/g, "-"),
      sessionId: sessionId || null,
      termId: termId || null,
      level: "primary",
      capacity: 40,
      isActive: true,
    });
  }

  return cls._id;
}

/**
 * =========================================
 * BULK UPSERT STUDENTS (ENTERPRISE)
 * =========================================
 */
export async function bulkUpsertStudents(rows, schoolId) {
  let created = 0;
  let updated = 0;
  let failed = 0;

  const results = [];

  const currentSession = await Session.findOne({
    schoolId,
    isCurrent: true,
  });

  const currentTerm = currentSession
    ? await Term.findOne({
        schoolId,
        sessionId: currentSession._id,
        isCurrent: true,
      })
    : null;

  for (const row of rows) {
    try {
      const classId = await resolveClassId({
        schoolId,
        className: row.className,
        sessionId: currentSession?._id,
        termId: currentTerm?._id,
      });

      const existing = await Student.findOne({
        schoolId,
        admissionNumber: row.admissionNumber,
      });
      
      if (!row.admissionNumber) {
  throw new Error(
    "Admission number is required"
  );
}

if (!row.firstName) {
  throw new Error(
    "First name is required"
  );
}

if (!row.lastName) {
  throw new Error(
    "Last name is required"
  );
}
      if (existing) {
       existing.firstName =
  row.firstName ?? existing.firstName;

existing.middleName =
  row.middleName ?? existing.middleName;

existing.lastName =
  row.lastName ?? existing.lastName;

existing.gender =
  row.gender ?? existing.gender;

existing.dateOfBirth =
  row.dateOfBirth || existing.dateOfBirth;

existing.phone =
  row.phone ?? existing.phone;

existing.entryType =
  row.entryType ?? existing.entryType;

existing.status =
  row.status ?? existing.status;

existing.classId = classId;
        await existing.save();

        updated++;

        results.push({
          admissionNumber: row.admissionNumber,
          action: "updated",
        });
      } else {
        await Student.create({
  schoolId,

  admissionNumber:
    row.admissionNumber,

  firstName:
    row.firstName,

  middleName:
    row.middleName || "",

  lastName:
    row.lastName,

  gender:
    row.gender || "male",

  dateOfBirth:
    row.dateOfBirth || null,

  phone:
    row.phone || "",

  entryType:
    row.entryType || "new",

  classId,

  status:
    row.status || "active",
});
        created++;

        results.push({
          admissionNumber: row.admissionNumber,
          action: "created",
        });
      }
    } catch (error) {
      failed++;

     results.push({
  admissionNumber:
    row.admissionNumber,
  student:
    `${row.firstName} ${row.lastName}`,
  action: "updated",
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