"use client";

import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import { AttendanceRecord } from "../../types/attendance";
import { formatDate } from "../../lib/utils";


type AttendanceTableProps = {
  data?: AttendanceRecord[];
};

export default function AttendanceTable({ data = [] }: AttendanceTableProps) {
  if (!data.length) {
    return (
      <EmptyState
        title="No attendance records found"
        description="Attendance records will appear here when available."
      />
    );
  }

  return (
    <DataTable
      data={data}
      columns={[
        {
          key: "student",
          title: "Student",
          render: (row) => (
            <div>
              <p className="font-semibold text-white">
                {row.studentName || "-"}
              </p>
              <p className="text-xs text-slate-400">
                {row.className || row.classId || "-"}
              </p>
            </div>
          ),
        },
        {
          key: "date",
          title: "Date",
          render: (row) => formatDate(row.date),
        },
        {
          key: "status",
          title: "Status",
          render: (row) => (
            <Badge
              label={row.status}
              variant={row.status === "present" ? "success" : "warning"}
            />
          ),
        },
        {
          key: "teacher",
          title: "Teacher",
          render: (row) => row.teacherName || "-",
        },
        {
          key: "createdAt",
          title: "Logged",
          render: (row) => formatDate(row.createdAt),
        },
      ]}
    />
  );
}