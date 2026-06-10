"use client";

import EmptyState from "../../components/ui/EmptyState";
import { TeacherPortalStudent } from "../../types/teacher-portal";

type TeacherAttendanceTableProps = {
  students: TeacherPortalStudent[];
  onToggleStatus: (
    studentId: string,
    status: "present" | "absent"
  ) => void;
};

export default function TeacherAttendanceTable({
  students,
  onToggleStatus,
}: TeacherAttendanceTableProps) {
  if (!students.length) {
    return (
      <EmptyState
        title="No students found"
        description="Students in this class will appear here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/[0.03]">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Student
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Admission No.
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {students.map((student) => {
              const status = student.attendanceStatus || "present";

              return (
                <tr key={student._id}>
                  <td className="px-5 py-4 text-sm text-slate-200">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">
                    {student.admissionNumber || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(student._id, "present")}
                        className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                          status === "present"
                            ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                            : "border border-white/10 bg-white/5 text-slate-300"
                        }`}
                      >
                        Present
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(student._id, "absent")}
                        className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                          status === "absent"
                            ? "bg-red-500/20 text-red-300 ring-1 ring-red-400/30"
                            : "border border-white/10 bg-white/5 text-slate-300"
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}