
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
        {
          key: "className",
          title: "Class",
          render: (row) =>
            row.className || displayName(row.classId),
        },
        {
          key: "parent",
          title: "Parent",
          render: (row) =>
            row.parentName || displayName(row.parentId),
        },
        {
          key: "gender",
          title: "Gender",
          render: (row) => row.gender || "-",
        },
        {
          key: "entryType",
          title: "Entry",
          render: (row) => (row as any).entryType || "-",
        },
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

        // STUDENT LOGIN ACCOUNT
        {
          key: "loginAccount",
          title: "Login Account",
          render: (row) => {
            const account = row.loginAccount;

            if (!account?.exists) {
              return (
                <div className="space-y-1">
                  <Badge label="Not created" variant="warning" />
                  <p className="text-xs text-slate-500">
                    No login account
                  </p>
                </div>
              );
            }

            if (!account.active) {
              return (
                <div className="space-y-1">
                  <Badge label="Disabled" variant="danger" />
                  <p className="text-xs text-slate-500">
                    Account inactive
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-1">
                <Badge label="Account active" variant="success" />
                <p className="text-xs text-slate-400">
                  {account.passwordChangedAt
                    ? `Password updated: ${formatDate(
                        account.passwordChangedAt
                      )}`
                    : "Password not changed"}
                </p>
                <p className="text-xs text-slate-500">
                  {account.lastLogin
                    ? `Last login: ${formatDate(account.lastLogin)}`
                    : "Never logged in"}
                </p>
              </div>
            );
          },
        },

        {
          key: "createdAt",
          title: "Created",
          render: (row) => formatDate(row.createdAt),
        },
        {
          key: "actions",
          title: "Actions",
          render: (row) => {
            const active = isStudentActive(row);
            const hasAccount = row.loginAccount?.exists;
            const studentName = getStudentFullName(row);

            return (
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  title={
                    !active
                      ? "Activate student before resetting password"
                      : hasAccount
                      ? "Regenerate student password"
                      : "Create student login account first"
                  }
                  aria-label={`Reset password for ${studentName}`}
                  disabled={!active || !hasAccount}
                  onClick={() => onResetPassword(row)}
                  className={`rounded-lg p-2 transition ${
                    active && hasAccount
                      ? "text-amber-300 hover:bg-amber-500/10"
                      : "cursor-not-allowed text-slate-600"
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
