"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import SectionCard from "../../../../components/ui/SectionCard";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";

import TeacherClassCards from "../../../../components/teacher/TeacherClassCards";
import TeacherAttendanceTable from "../../../../components/teacher/TeacherAttendanceTable";
import TeacherAnnouncementsList from "../../../../components/teacher/TeacherAnnouncementsList";

import {
  getTeacherClassStudents,
  getTeacherPortalOverview,
  submitTeacherAttendance,
} from "../../../../lib/teacher-portal";

import {
  TeacherAssignedClass,
  TeacherPortalAnnouncement,
  TeacherPortalStudent,
} from "../../../../types/teacher-portal";

export default function TeacherStudentsPage() {
  const [classes, setClasses] = useState<TeacherAssignedClass[]>([]);
  const [announcements, setAnnouncements] = useState<
    TeacherPortalAnnouncement[]
  >([]);

  const [students, setStudents] = useState<TeacherPortalStudent[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  const [pageError, setPageError] = useState("");
  const [studentsError, setStudentsError] = useState("");

  const [actionMessage, setActionMessage] = useState("");
  const [actionSuccess, setActionSuccess] = useState(false);

  async function loadOverview() {
    try {
      setLoading(true);
      setPageError("");

      const data = await getTeacherPortalOverview();

      setClasses(data.classes || []);
      setAnnouncements(data.announcements || []);

      if (data.classes?.length > 0) {
        setSelectedClassId(data.classes[0]._id);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message ||
            "Failed to load teacher portal information."
        );
      } else {
        setPageError(
          "Failed to load teacher portal information."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents(classId: string) {
    try {
      setStudentsLoading(true);
      setStudentsError("");
      setActionMessage("");

      const data = await getTeacherClassStudents(classId);

      console.log("📚 STUDENTS RECEIVED:", data);

      const normalizedStudents = (data || []).map((item) => ({
        ...item,
        attendanceStatus:
          item.attendanceStatus || "present",
      }));

      console.log(
        "📚 NORMALIZED STUDENTS:",
        normalizedStudents
      );

      setStudents(normalizedStudents);
    } catch (err: unknown) {
      console.error("❌ LOAD STUDENTS ERROR", err);

      if (axios.isAxiosError(err)) {
        setStudentsError(
          err.response?.data?.message ||
            "Failed to load class students."
        );
      } else {
        setStudentsError(
          "Failed to load class students."
        );
      }

      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId]);

  function handleToggleStatus(
    studentId: string,
    status: "present" | "absent"
  ) {
    setStudents((prev) =>
      prev.map((student) =>
        student._id === studentId
          ? {
              ...student,
              attendanceStatus: status,
            }
          : student
      )
    );
  }

  async function handleSubmitAttendance() {
    if (!selectedClassId || students.length === 0) {
      return;
    }

    try {
      setSubmittingAttendance(true);
      setActionMessage("");
      setActionSuccess(false);

      await submitTeacherAttendance({
        classId: selectedClassId,
        attendance: students.map((student) => ({
          studentId: student._id,
          status:
            student.attendanceStatus || "present",
        })),
      });

      setActionSuccess(true);
      setActionMessage(
        "✅ Attendance submitted successfully."
      );

      await loadStudents(selectedClassId);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionMessage(
          err.response?.data?.message ||
            "Failed to submit attendance."
        );
      } else {
        setActionMessage(
          "Failed to submit attendance."
        );
      }

      setActionSuccess(false);
    } finally {
      setSubmittingAttendance(false);
    }
  }

  const selectedClass = useMemo(() => {
    return (
      classes.find(
        (item) => item._id === selectedClassId
      ) || null
    );
  }, [classes, selectedClassId]);

  if (loading) {
    return <PageLoader />;
  }

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load teacher portal"
        description={pageError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Assigned Classes"
        subtitle="Select a class to manage attendance and students"
      >
        <TeacherClassCards
          classes={classes}
          selectedClassId={selectedClassId}
          onSelect={setSelectedClassId}
        />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title={
              selectedClass
                ? `${selectedClass.name} Attendance`
                : "Attendance"
            }
            subtitle="Mark attendance for students in the selected class"
            rightAction={
              <button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={
                  submittingAttendance ||
                  studentsLoading ||
                  students.length === 0
                }
                className="btn-primary"
              >
                {submittingAttendance
                  ? "Submitting..."
                  : "Submit Attendance"}
              </button>
            }
          >
            {actionMessage && (
              <div
                className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
                  actionSuccess
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {actionMessage}
              </div>
            )}

            {studentsLoading ? (
              <PageLoader />
            ) : studentsError ? (
              <EmptyState
                title="Unable to load students"
                description={studentsError}
              />
            ) : students.length === 0 ? (
              <EmptyState
                title="No students found"
                description="There are currently no students assigned to this class."
              />
            ) : (
              <TeacherAttendanceTable
                students={students}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </SectionCard>
        </div>

        <div className="xl:col-span-1">
          <SectionCard
            title="Announcements"
            subtitle="Latest updates from school admin"
          >
            <TeacherAnnouncementsList
              items={announcements}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}