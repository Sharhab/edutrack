"use client";

import React, { useEffect, useState } from "react";

import {
  getTeacherClassStudents,
  getTeacherPortalOverview,
  getTeacherResultContext,
  submitTeacherAttendance,
} from "../../../../ib/teacher-portals";

import {
  TeacherAssignedClass,
  TeacherPortalStudent,
} from "../../../../types/teacher-portal";

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<TeacherAssignedClass[]>([]);
  const [students, setStudents] = useState<TeacherPortalStudent[]>([]);

  const [selectedClassId, setSelectedClassId] = useState("");

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [attendance, setAttendance] = useState<
    Record<string, "present" | "absent">
  >({});

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    try {
      setLoading(true);
      setError("");

      const [overview, context] = await Promise.all([
        getTeacherPortalOverview(),
        getTeacherResultContext(),
      ]);

      setClasses(overview.classes || []);

      const activeSession =
        context?.session?._id ||
        context?.session?.id ||
        "";

      const activeTerm =
        context?.term?._id ||
        context?.term?.id ||
        "";

      setSessionId(activeSession);
      setTermId(activeTerm);

      if (overview.classes?.length) {
        setSelectedClassId(
          String(
            overview.classes[0]._id ||
              overview.classes[0].id ||
              ""
          )
        );
      }
    } catch (err: any) {
      console.error("❌ Failed to load teacher attendance:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load attendance"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }

    loadStudents(selectedClassId);
  }, [selectedClassId]);

  async function loadStudents(classId: string) {
    try {
      setStudentsLoading(true);
      setError("");
      setMessage("");

      const result =
        await getTeacherClassStudents(classId);

      setStudents(result || []);

      const initialAttendance: Record<
        string,
        "present" | "absent"
      > = {};

      (result || []).forEach((student: any) => {
        const id = String(
          student._id ||
            student.id ||
            student.studentId
        );

        initialAttendance[id] = "present";
      });

      setAttendance(initialAttendance);
    } catch (err: any) {
      console.error(
        "❌ Failed to load students:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load students"
      );
    } finally {
      setStudentsLoading(false);
    }
  }

  function updateAttendance(
    studentId: string,
    status: "present" | "absent"
  ) {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  }

  async function handleSubmit() {
    try {
      setMessage("");
      setError("");

      if (!selectedClassId) {
        setError("Please select a class.");
        return;
      }

      if (!sessionId) {
        setError(
          "No academic session is available. Please contact the school administrator."
        );
        return;
      }

      if (!termId) {
        setError(
          "No academic term is available. Please contact the school administrator."
        );
        return;
      }

      if (!students.length) {
        setError("No students found for this class.");
        return;
      }

      setSubmitting(true);

      const payload = {
        classId: selectedClassId,
        sessionId,
        termId,
        attendance: students.map((student: any) => {
          const studentId = String(
            student._id ||
              student.id ||
              student.studentId
          );

          return {
            studentId,
            status:
              attendance[studentId] || "present",
          };
        }),
      };

      console.log(
        "📤 TEACHER ATTENDANCE PAYLOAD:",
        payload
      );

      await submitTeacherAttendance(payload);

      setMessage(
        "Attendance submitted successfully."
      );
    } catch (err: any) {
      console.error(
        "❌ Attendance submission failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit attendance"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading attendance...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Attendance
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Mark attendance for your assigned class.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {message}
        </div>
      )}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium mb-2">
          Class
        </label>

        <select
          value={selectedClassId}
          onChange={(e) =>
            setSelectedClassId(e.target.value)
          }
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">
            Select class
          </option>

          {classes.map((classItem: any) => {
            const id = String(
              classItem._id ||
                classItem.id ||
                ""
            );

            return (
              <option key={id} value={id}>
                {classItem.name ||
                  classItem.className ||
                  classItem.title ||
                  "Class"}
              </option>
            );
          })}
        </select>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-semibold">
            Students
          </h2>
        </div>

        {studentsLoading ? (
          <div className="p-6">
            <p>Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-6 text-gray-500">
            No students found.
          </div>
        ) : (
          <div className="divide-y">
            {students.map((student: any) => {
              const studentId = String(
                student._id ||
                  student.id ||
                  student.studentId
              );

              const name =
                student.name ||
                student.fullName ||
                `${student.firstName || ""} ${
                  student.lastName || ""
                }`.trim() ||
                "Student";

              return (
                <div
                  key={studentId}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="font-medium">
                      {name}
                    </p>

                    {student.admissionNumber && (
                      <p className="text-sm text-gray-500">
                        {student.admissionNumber}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateAttendance(
                          studentId,
                          "present"
                        )
                      }
                      className={`rounded-lg px-4 py-2 text-sm ${
                        attendance[studentId] ===
                        "present"
                          ? "bg-green-600 text-white"
                          : "border bg-white"
                      }`}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateAttendance(
                          studentId,
                          "absent"
                        )
                      }
                      className={`rounded-lg px-4 py-2 text-sm ${
                        attendance[studentId] ===
                        "absent"
                          ? "bg-red-600 text-white"
                          : "border bg-white"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            submitting ||
            !selectedClassId ||
            !sessionId ||
            !termId ||
            !students.length
          }
          className="rounded-lg bg-black px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Submitting..."
            : "Submit Attendance"}
        </button>
      </div>
    </div>
  );
}
