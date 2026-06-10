import { Teacher } from "../teachers/teacher.model.js";
import { Student } from "../students/student.model.js";
import { Announcement } from "../announcements/announcement.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { ApiError } from "../../utils/apiError.js";

/* =========================================
   GET TEACHER PROFILE
========================================= */
async function getTeacherProfile(userId) {
  const teacher = await Teacher.findOne({ userId })
    .populate("userId", "firstName lastName email")
    .populate("classIds", "name")
    .lean();

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  return teacher;
}

/* =========================================
   TEACHER PORTAL OVERVIEW
========================================= */
export async function getTeacherPortalOverview(userId) {
  const teacher = await Teacher.findOne({
    userId,
    status: "active",
  })
    .populate({
      path: "userId",
      select: "firstName lastName email",
    })
    .populate({
      path: "classIds",
      select: "name",
    })
    .lean();

  if (!teacher) {
    throw new ApiError(404, "Teacher profile not found");
  }

  const announcements = await Announcement.find({
    schoolId: teacher.schoolId,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("title message createdAt")
    .lean();

  return {
    teacher: {
      id: teacher._id,
      firstName: teacher.userId?.firstName || "",
      lastName: teacher.userId?.lastName || "",
      email: teacher.userId?.email || "",
    },

    classes: (teacher.classIds || []).map((cls) => ({
      _id: cls._id,
      name: cls.name || "Unnamed Class",
    })),

    announcements: announcements || [],
  };
}

/* =========================================
   GET CLASS STUDENTS (FIXED)
========================================= */
export async function getTeacherClassStudents(userId, classId) {
  const teacher = await Teacher.findOne({
    userId,
    status: "active",
  }).lean();

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  const isAssigned = (teacher.classIds || []).some(
    (id) => String(id) === String(classId)
  );

  if (!isAssigned) {
    throw new ApiError(403, "You are not assigned to this class");
  }

  const students = await Student.find({
    schoolId: teacher.schoolId,
    classId: classId,
  })
    .sort({ firstName: 1, lastName: 1 })
    .select("firstName lastName admissionNumber gender classId");

 return {
  students: students.map((student) => ({
    _id: student._id,
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    fullName: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
    admissionNumber: student.admissionNumber || "",
    gender: student.gender || "",
    attendanceStatus: "present",
  })),
};
}

/* =========================================
   SUBMIT ATTENDANCE (FIXED CLEAN)
========================================= */
export async function submitTeacherAttendance(userId, payload) {
  const { classId, attendance } = payload;

  const teacher = await Teacher.findOne({
    userId,
    status: "active",
  }).lean();

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  const isAssigned = (teacher.classIds || []).some(
    (id) => String(id) === String(classId)
  );

  if (!isAssigned) {
    throw new ApiError(403, "You are not assigned to this class");
  }

  if (!Array.isArray(attendance)) {
    throw new ApiError(400, "Attendance data required");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const item of attendance) {
    await Attendance.findOneAndUpdate(
      {
        schoolId: teacher.schoolId,
        classId,
        studentId: item.studentId,
        date: today,
      },
      {
        schoolId: teacher.schoolId,
        classId,
        studentId: item.studentId,
        status: item.status || "present",
        markedBy: teacher.userId,
      },
      { upsert: true, new: true }
    );
  }

  return {
    success: true,
    message: "Attendance submitted successfully",
  };
}