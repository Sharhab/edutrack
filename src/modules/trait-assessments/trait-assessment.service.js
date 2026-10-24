
import mongoose from "mongoose";

import { ApiError } from "../../utils/apiError.js";
import { Student } from "../students/student.model.js";
import { ClassModel } from "../classes/class.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { Teacher } from "../teachers/teacher.model.js";

import { TraitAssessment } from "./trait-assessment.model.js";

import {
  PSYCHOMOTOR_TRAITS,
  AFFECTIVE_TRAITS,
} from "./trait-assessment.constants.js";

function getUserId(user) {
  return user?._id || user?.id;
}

function requireObjectId(value, label) {
  if (!value || !mongoose.isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
}

function normalizeRatings(ratings, allowedTraits, label) {
  if (!Array.isArray(ratings)) {
    throw new ApiError(400, `${label} must be an array`);
  }

  const allowed = new Map(
    allowedTraits.map((trait) => [trait.key, trait])
  );

  const seen = new Set();

  return ratings.map((item) => {
    const trait = allowed.get(item?.traitKey);

    if (!trait) {
      throw new ApiError(
        400,
        `Invalid ${label} trait: ${item?.traitKey}`
      );
    }

    if (seen.has(item.traitKey)) {
      throw new ApiError(
        400,
        `Duplicate ${label} trait: ${item.traitKey}`
      );
    }

    seen.add(item.traitKey);

    const rating = Number(item.rating);

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      throw new ApiError(
        400,
        `Rating for ${trait.name} must be between 1 and 5`
      );
    }

    // Use the server's canonical trait name, not a client-supplied name.
    return {
      traitKey: trait.key,
      traitName: trait.name,
      rating,
    };
  });
}

async function validateAcademicPeriod({
  schoolId,
  sessionId,
  termId,
}) {
  requireObjectId(sessionId, "session ID");
  requireObjectId(termId, "term ID");

  const session = await Session.findOne({
    _id: sessionId,
    schoolId,
  });

  if (!session) {
    throw new ApiError(400, "Invalid academic session");
  }

  const term = await Term.findOne({
    _id: termId,
    schoolId,
    sessionId: session._id,
  });

  if (!term) {
    throw new ApiError(
      400,
      "The selected term does not belong to this session"
    );
  }

  return { session, term };
}

async function ensureCanAssessClass({
  user,
  schoolId,
  classId,
}) {
  const userId = getUserId(user);

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const schoolAdmin =
    user.role === "school_admin" ||
    user.role === "super_admin";

  if (schoolAdmin) {
    return;
  }

  if (user.role !== "teacher") {
    throw new ApiError(
      403,
      "You are not allowed to assess student traits"
    );
  }

  const teacher = await Teacher.findOne({
    userId,
    schoolId,
    isActive: true,
    status: "active",
  });

  if (!teacher) {
    throw new ApiError(403, "Active teacher profile not found");
  }

  const schoolClass = await ClassModel.findOne({
    _id: classId,
    schoolId,
  }).select("classTeacherId");

  const isClassTeacher =
    teacher.classTeacherOf?.toString() ===
      classId.toString() ||
    schoolClass?.classTeacherId?.toString() ===
      userId.toString();

  if (!isClassTeacher) {
    throw new ApiError(
      403,
      "Only the assigned class teacher can assess these traits"
    );
  }

  return teacher;
}

export async function getClassTraitAssessments({
  user,
  schoolId,
  classId,
  sessionId,
  termId,
}) {
  requireObjectId(classId, "class ID");

  await ensureCanAssessClass({
    user,
    schoolId,
    classId,
  });

  await validateAcademicPeriod({
    schoolId,
    sessionId,
    termId,
  });

  const schoolClass = await ClassModel.findOne({
    _id: classId,
    schoolId,
  });

  if (!schoolClass) {
    throw new ApiError(404, "Class not found");
  }

  const students = await Student.find({
    schoolId,
    classId,
    status: "active",
  })
    .select("firstName middleName lastName admissionNumber")
    .sort({ firstName: 1, lastName: 1 })
    .lean();

  const assessments = await TraitAssessment.find({
    schoolId,
    classId,
    sessionId,
    termId,
    studentId: { $in: students.map((student) => student._id) },
  }).lean();

  const assessmentByStudent = new Map(
    assessments.map((assessment) => [
      assessment.studentId.toString(),
      assessment,
    ])
  );

  return students.map((student) => ({
    student: {
      _id: student._id,
      firstName: student.firstName,
      middleName: student.middleName || "",
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
    },
    assessment:
      assessmentByStudent.get(student._id.toString()) || null,
  }));
}

export async function saveStudentTraitAssessment({
  user,
  schoolId,
  studentId,
  payload,
}) {
  requireObjectId(studentId, "student ID");
  requireObjectId(payload.classId, "class ID");

  const userId = getUserId(user);

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { session, term } = await validateAcademicPeriod({
    schoolId,
    sessionId: payload.sessionId,
    termId: payload.termId,
  });

  await ensureCanAssessClass({
    user,
    schoolId,
    classId: payload.classId,
  });

  const student = await Student.findOne({
    _id: studentId,
    schoolId,
    classId: payload.classId,
    status: "active",
  }).select("_id classId");

  if (!student) {
    throw new ApiError(
      404,
      "Active student not found in this class"
    );
  }

  const psychomotor = normalizeRatings(
    payload.psychomotor,
    PSYCHOMOTOR_TRAITS,
    "psychomotor"
  );

  const affective = normalizeRatings(
    payload.affective,
    AFFECTIVE_TRAITS,
    "affective"
  );

  const teacherComment = String(
    payload.teacherComment || ""
  ).trim();

  if (teacherComment.length > 1000) {
    throw new ApiError(
      400,
      "Teacher comment cannot exceed 1000 characters"
    );
  }

  const assessment = await TraitAssessment.findOneAndUpdate(
    {
      schoolId,
      studentId,
      sessionId: session._id,
      termId: term._id,
    },
    {
      $set: {
        schoolId,
        studentId,
        classId: payload.classId,
        sessionId: session._id,
        termId: term._id,
        psychomotor,
        affective,
        teacherComment,
        enteredBy: userId,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return assessment;
}
