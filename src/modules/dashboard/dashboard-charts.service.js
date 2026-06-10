import { Student } from "../students/student.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Parent } from "../parents/parent.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Result } from "../results/result.model.js";
import { Announcement } from "../announcements/announcement.model.js";
import { Teacher as TeacherProfile } from "../teachers/teacher.model.js";
import { Parent as ParentProfile } from "../parents/parent.model.js";
import { ensureParentOwnsStudent } from "../parents/parent.guard.js";
import { ApiError } from "../../utils/apiError.js";

function monthLabel(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function gradeBucket(total) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

export async function getSuperAdminCharts() {
  const [students, teachers, parents, attendance, results] = await Promise.all([
    Student.find().select("createdAt"),
    Teacher.find().select("createdAt"),
    Parent.find().select("createdAt"),
    Attendance.find().select("createdAt status"),
    Result.find().select("total createdAt"),
  ]);

  const growthMap = {};

  [...students, ...teachers, ...parents].forEach((item) => {
    const key = monthLabel(item.createdAt);
    if (!growthMap[key]) {
      growthMap[key] = { month: key, students: 0, teachers: 0, parents: 0 };
    }
  });

  students.forEach((item) => {
    const key = monthLabel(item.createdAt);
    if (!growthMap[key]) growthMap[key] = { month: key, students: 0, teachers: 0, parents: 0 };
    growthMap[key].students += 1;
  });

  teachers.forEach((item) => {
    const key = monthLabel(item.createdAt);
    if (!growthMap[key]) growthMap[key] = { month: key, students: 0, teachers: 0, parents: 0 };
    growthMap[key].teachers += 1;
  });

  parents.forEach((item) => {
    const key = monthLabel(item.createdAt);
    if (!growthMap[key]) growthMap[key] = { month: key, students: 0, teachers: 0, parents: 0 };
    growthMap[key].parents += 1;
  });

  const attendanceSummary = {
    present: attendance.filter((x) => x.status === "present").length,
    absent: attendance.filter((x) => x.status === "absent").length,
    late: attendance.filter((x) => x.status === "late").length,
  };

  const gradeSummary = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  results.forEach((r) => {
    gradeSummary[gradeBucket(r.total || 0)] += 1;
  });

  return {
    charts: {
      growth: Object.values(growthMap).sort((a, b) => a.month.localeCompare(b.month)),
      attendanceSummary,
      gradeSummary,
    },
  };
}

export async function getSchoolAdminCharts(user) {
  const schoolId = user.schoolId;

  const [students, teachers, attendance, results] = await Promise.all([
    Student.find({ schoolId }).select("createdAt"),
    Teacher.find({ schoolId }).select("createdAt"),
    Attendance.find({ schoolId }).select("createdAt status"),
    Result.find({ schoolId }).select("total createdAt"),
  ]);

  const growthMap = {};

  students.forEach((item) => {
    const key = monthLabel(item.createdAt);
    if (!growthMap[key]) growthMap[key] = { month: key, students: 0, teachers: 0 };
    growthMap[key].students += 1;
  });

  teachers.forEach((item) => {
    const key = monthLabel(item.createdAt);
    if (!growthMap[key]) growthMap[key] = { month: key, students: 0, teachers: 0 };
    growthMap[key].teachers += 1;
  });

  const attendanceSummary = {
    present: attendance.filter((x) => x.status === "present").length,
    absent: attendance.filter((x) => x.status === "absent").length,
    late: attendance.filter((x) => x.status === "late").length,
  };

  const gradeSummary = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  results.forEach((r) => {
    gradeSummary[gradeBucket(r.total || 0)] += 1;
  });

  return {
    charts: {
      growth: Object.values(growthMap).sort((a, b) => a.month.localeCompare(b.month)),
      attendanceSummary,
      gradeSummary,
    },
  };
}

export async function getTeacherCharts(user) {
  const teacher = await TeacherProfile.findOne({
    schoolId: user.schoolId,
    userId: user._id,
  });

  if (!teacher) {
    throw new ApiError(404, "Teacher profile not found");
  }

  const [attendance, results] = await Promise.all([
    Attendance.find({
      schoolId: user.schoolId,
      classId: { $in: teacher.classIds },
    }).select("createdAt status"),
    Result.find({
      schoolId: user.schoolId,
      classId: { $in: teacher.classIds },
      subjectId: { $in: teacher.subjectIds },
    }).select("total createdAt"),
  ]);

  const attendanceSummary = {
    present: attendance.filter((x) => x.status === "present").length,
    absent: attendance.filter((x) => x.status === "absent").length,
    late: attendance.filter((x) => x.status === "late").length,
  };

  const gradeSummary = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  results.forEach((r) => {
    gradeSummary[gradeBucket(r.total || 0)] += 1;
  });

  return {
    charts: {
      attendanceSummary,
      gradeSummary,
    },
  };
}

export async function getParentCharts(user) {
  const parent = await ParentProfile.findOne({
    schoolId: user.schoolId,
    userId: user._id,
  });

  if (!parent) {
    throw new ApiError(404, "Parent profile not found");
  }

  const [attendance, results] = await Promise.all([
    Attendance.find({
      schoolId: user.schoolId,
      studentId: { $in: parent.studentIds },
    }).select("studentId status createdAt"),
    Result.find({
      schoolId: user.schoolId,
      studentId: { $in: parent.studentIds },
    }).select("studentId total createdAt"),
  ]);

  const attendanceSummary = {
    present: attendance.filter((x) => x.status === "present").length,
    absent: attendance.filter((x) => x.status === "absent").length,
    late: attendance.filter((x) => x.status === "late").length,
  };

  const gradeSummary = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  results.forEach((r) => {
    gradeSummary[gradeBucket(r.total || 0)] += 1;
  });

  return {
    charts: {
      attendanceSummary,
      gradeSummary,
    },
  };
}

export async function getParentChildCharts(user, studentId) {
  await ensureParentOwnsStudent(user, studentId);

  const [attendance, results] = await Promise.all([
    Attendance.find({
      schoolId: user.schoolId,
      studentId,
    }).select("status createdAt"),
    Result.find({
      schoolId: user.schoolId,
      studentId,
    }).select("total createdAt"),
  ]);

  const attendanceSummary = {
    present: attendance.filter((x) => x.status === "present").length,
    absent: attendance.filter((x) => x.status === "absent").length,
    late: attendance.filter((x) => x.status === "late").length,
  };

  const gradeSummary = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  results.forEach((r) => {
    gradeSummary[gradeBucket(r.total || 0)] += 1;
  });

  return {
    charts: {
      attendanceSummary,
      gradeSummary,
    },
  };
}