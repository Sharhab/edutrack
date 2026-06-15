"use client";

import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { Teacher } from "../../types/teacher";
import { formatDate } from "../../lib/utils";
import { Pencil, Trash2 } from "lucide-react";

type TeachersTableProps = {
  data: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
};

function displayName(value: unknown): string {
  if (!value) return "-";

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    if (!value.length) return "-";
    return value.map((item) => displayName(item)).join(", ");
  }

  if (typeof value === "object") {
    const obj = value as {
      _id?: string;
      name?: string;
      title?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      level?: string;
      arm?: string;
    };

    const fullName = [obj.firstName, obj.lastName]
      .filter(Boolean)
      .join(" ");

    const className = [obj.name, obj.level, obj.arm]
      .filter(Boolean)
      .join(" ");

    return className || obj.title || fullName || obj.email || obj._id || "-";
  }

  return String(value);
}

function getTeacherName(row: Teacher): string {
  const firstName = row.userId?.firstName || row.firstName || "";
  const lastName = row.userId?.lastName || row.lastName || "";
  return `${firstName} ${lastName}`.trim() || "-";
}

function getTeacherEmail(row: Teacher): string {
  return row.userId?.email || row.email || "-";
}

function getTeacherPhone(row: Teacher): string {
  return row.userId?.phone || row.phone || "-";
}

function getTeacherSubject(row: Teacher): string {
  if (
    row.subjectIds &&
    Array.isArray(row.subjectIds) &&
    row.subjectIds.length
  ) {
    return displayName(row.subjectIds);
  }

  return "-";
}

function getTeacherClasses(row: Teacher): string {
  if (row.classNames?.length) {
    return row.classNames.join(", ");
  }

  if (
    row.classIds &&
    Array.isArray(row.classIds) &&
    row.classIds.length
  ) {
    return displayName(row.classIds);
  }

  return "-";
}

function isTeacherActive(row: Teacher): boolean {
  if (row.status) return row.status === "active";
  if (typeof row.isActive === "boolean") return row.isActive;
  return row.userId?.isActive !== false;
}

export default function TeachersTable({
  data,
  onEdit,
  onDelete,
}: TeachersTableProps) {
  if (!data.length) {
    return (
      <EmptyState
        title="No teachers found"
        description="Teachers will appear here after they are added."
      />
    );
  }

  return (
    <DataTable<Teacher>
      data={data}
      columns={[
        {
          key: "teacher",
          title: "Teacher",
          render: (row) => (
            <div>
              <p className="font-semibold text-white">
                {getTeacherName(row)}
              </p>
              <p className="text-xs text-slate-400">
                {getTeacherEmail(row)}
              </p>
            </div>
          ),
        },
        {
          key: "employeeId",
          title: "Employee ID",
          render: (row) => row.employeeId || "-",
        },
        {
          key: "subject",
          title: "Subject",
          render: (row) => getTeacherSubject(row),
        },
        {
          key: "classes",
          title: "Classes",
          render: (row) => getTeacherClasses(row),
        },
        {
          key: "phone",
          title: "Phone",
          render: (row) => getTeacherPhone(row),
        },
        {
          key: "status",
          title: "Status",
          render: (row) => {
            const active = isTeacherActive(row);

            return (
              <Badge
                label={active ? "active" : "inactive"}
                variant={active ? "success" : "warning"}
              />
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