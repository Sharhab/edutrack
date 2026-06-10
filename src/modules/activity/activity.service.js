import { Announcement } from "../announcements/announcement.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Result } from "../results/result.model.js";
import { School } from "../schools/school.model.js";
import { ApiError } from "../../utils/apiError.js";

export async function getRecentActivity(user) {
  if (user.role === "super_admin") {
    const [schools, announcements] = await Promise.all([
      School.find().sort({ createdAt: -1 }).limit(10),
      Announcement.find().sort({ createdAt: -1 }).limit(10),
    ]);

    const items = [
      ...schools.map((item) => ({
        type: "school_created",
        title: "New school created",
        message: item.name,
        createdAt: item.createdAt,
      })),
      ...announcements.map((item) => ({
        type: "announcement_created",
        title: item.title,
        message: item.message,
        createdAt: item.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { items: items.slice(0, 20) };
  }

  if (!user.schoolId) {
    throw new ApiError(400, "School scope missing");
  }

  const [attendance, results, announcements] = await Promise.all([
    Attendance.find({ schoolId: user.schoolId })
      .populate("studentId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(10),
    Result.find({ schoolId: user.schoolId })
      .populate("studentId", "firstName lastName")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 })
      .limit(10),
    Announcement.find({ schoolId: user.schoolId })
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const items = [
    ...attendance.map((item) => ({
      type: "attendance_marked",
      title: "Attendance marked",
      message: `${item.studentId?.firstName || ""} ${item.studentId?.lastName || ""} - ${item.status}`,
      createdAt: item.createdAt,
    })),
    ...results.map((item) => ({
      type: "result_saved",
      title: "Result saved",
      message: `${item.studentId?.firstName || ""} ${item.studentId?.lastName || ""} - ${item.subjectId?.name || ""}`,
      createdAt: item.createdAt,
    })),
    ...announcements.map((item) => ({
      type: "announcement_created",
      title: item.title,
      message: item.message,
      createdAt: item.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { items: items.slice(0, 20) };
}