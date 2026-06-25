"use client";

import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { Student } from "../../types/student";
import { formatDate } from "../../lib/utils";
import { Pencil, Trash2 } from "lucide-react";

type StudentsTableProps = {
  data: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
};

function displayName(value: unknown) {
  if (!value) return "-";

  if (typeof value === "string") return value;

  if (typeof value === "object" && value !== null) {
    const obj = value as {
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    };

    const fullName = [obj.firstName, obj.lastName]
      .filter(Boolean)
      .join(" ");

    return obj.name || fullName || obj.email || "-";
  }

  return String(value);
}

function getStudentFullName(row: Student) {
  const middle = (row as any).middleName
    ? ` ${(row as any).middleName} `
    : " ";

  return `${row.firstName}${middle}${row.lastName}`;
}

export default function StudentsTable({
  data,
  onEdit,
  onDelete,
}: StudentsTableProps) {
  if (!data.length) {
    return (
      <EmptyState
        title="No students found"
        description="Students will appear here after they are added."
      />
    );
  }

  return (
    <DataTable<Student>
      data={data}
      columns={[
        // ================= STUDENT =================
        {
          key: "student",
          title: "Student",
          render: (row) => (
            <div>
              <p className="font-semibold text-white">
                {getStudentFullName(row)}
              </p>

              <p className="text-xs text-slate-400">
                {row.email || row.phone || "-"}
              </p>

              <p className="text-[10px] text-slate-500">
                {row.admissionNumber || "-"}
              </p>
            </div>
          ),
        },

        // ================= CLASS =================
        {
          key: "className",
          title: "Class",
          render: (row) =>
            row.className || displayName(row.classId),
        },

        // ================= PARENT =================
        {
          key: "parent",
          title: "Parent",
          render: (row) =>
            row.parentName || displayName(row.parentId),
        },

        // ================= GENDER =================
        {
          key: "gender",
          title: "Gender",
          render: (row) => row.gender || "-",
        },

        // ================= ENTRY TYPE (NEW ADDITION) =================
        {
          key: "entryType",
          title: "Entry",
          render: (row) => (row as any).entryType || "-",
        },

        // ================= STATUS =================
        {
          key: "status",
          title: "Status",
          render: (row) => (
            <Badge
              label={row.status || "active"}
              variant={
                row.status === "inactive"
                  ? "warning"
                  : row.status === "suspended"
                  ? "danger"
                  : "success"
              }
            />
          ),
        },

        // ================= CREATED DATE =================
        {
          key: "createdAt",
          title: "Created",
          render: (row) => formatDate(row.createdAt),
        },

        // ================= ACTIONS =================
        {
          key: "actions",
          title: "Actions",
          render: (row) => (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                onClick={() => onDelete(row)}
                className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ]}
    />
  );
}