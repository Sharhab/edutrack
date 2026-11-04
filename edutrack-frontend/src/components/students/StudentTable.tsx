
"use client";

import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import type { Student } from "../../types/student";
import { formatDate } from "../../lib/utils";
import { KeyRound, Pencil, Trash2 } from "lucide-react";

type StudentsTableProps = {
  data: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onResetPassword: (student: Student) => void;
};

function displayName(value: unknown): string {
  if (!value) return "-";

  if (typeof value === "string") return value;

  if (typeof value === "object" && value !== null) {
    const obj = value as {
      _id?: string;
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

function getStudentFullName(row: Student): string {
  const middleName = (row as any).middleName;

  return [row.firstName, middleName, row.lastName]
    .filter(Boolean)
    .join(" ");
}

function isStudentActive(student: Student): boolean {
  return (
    student.status !== "inactive" &&
    student.status !== "suspended"
  );
}

export default function StudentsTable({
  data,
  onEdit,
  onDelete,
  onResetPassword,
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
        // STUDENT
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

        // CLASS
        {
          key: "className",
          title: "Class",
          render: (row) =>
            row.className || displayName(row.classId),
        },

        // PARENT
        {
          key: "parent",
          title: "Parent",
          render: (row) =>
            row.parentName || displayName(row.parentId),
        },

        // GENDER
        {
          key: "gender",
          title: "Gender",
          render: (row) => row.gender || "-",
        },

        // ENTRY TYPE
        {
          key: "entryType",
          title: "Entry",
          render: (row) => (row as any).entryType || "-",
        },

        // STATUS
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

        // CREATED DATE
        {
          key: "createdAt",
          title: "Created",
          render: (row) => formatDate(row.createdAt),
        },

        // ACTIONS
        {
          key: "actions",
          title: "Actions",
          render: (row) => {
            const active = isStudentActive(row);
            const studentName = getStudentFullName(row);

            return (
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  title={
                    active
                      ? "Reset student password"
                      : "Activate student before resetting password"
                  }
                  aria-label={`Reset password for ${studentName}`}
                  onClick={() => onResetPassword(row)}
                  className={`rounded-lg p-2 transition ${
                    active
                      ? "text-amber-300 hover:bg-amber-500/10"
                      : "text-slate-500 hover:bg-white/5"
                  }`}
                >
                  <KeyRound size={17} />
                </button>

                <button
                  type="button"
                  title="Edit student"
                  aria-label={`Edit ${studentName}`}
                  onClick={() => onEdit(row)}
                  className="rounded-lg p-2 text-cyan-300 transition hover:bg-cyan-500/10"
                >
                  <Pencil size={17} />
                </button>

                <button
                  type="button"
                  title="Delete student"
                  aria-label={`Delete ${studentName}`}
                  onClick={() => onDelete(row)}
                  className="rounded-lg p-2 text-red-300 transition hover:bg-red-500/10"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            );
          },
        },
      ]}
    />
  );
}
