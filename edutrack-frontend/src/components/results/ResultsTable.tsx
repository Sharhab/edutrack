"use client";

import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import { Result } from "../../types/result";
import { formatDate } from "../../lib/utils";
import { Pencil, Trash2 } from "lucide-react";

type ResultsTableProps = {
  data: Result[];
  onEdit: (result: Result) => void;
  onDelete: (result: Result) => void;
};

export default function ResultsTable({
  data,
  onEdit,
  onDelete,
}: ResultsTableProps) {
  if (!data.length) {
    return (
      <EmptyState
        title="No results found"
        description="Results will appear here after they are added."
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
              <p className="font-semibold text-white">{row.studentName || "-"}</p>
              <p className="text-xs text-slate-400">{row.className || row.classId || "-"}</p>
            </div>
          ),
        },
        {
          key: "subject",
          title: "Subject",
          render: (row) => row.subjectName || row.subjectId || "-",
        },
        {
          key: "session",
          title: "Session",
          render: (row) => row.session || "-",
        },
        {
          key: "term",
          title: "Term",
          render: (row) => row.term || "-",
        },
        {
          key: "scores",
          title: "Scores",
          render: (row) => (
            <div>
              <p className="text-sm text-white">CA: {row.caScore}</p>
              <p className="text-xs text-slate-400">Exam: {row.examScore}</p>
            </div>
          ),
        },
        {
          key: "total",
          title: "Total",
          render: (row) => row.totalScore,
        },
        {
          key: "grade",
          title: "Grade",
          render: (row) => (
            <Badge
              label={row.grade || "-"}
              variant={row.grade === "A" || row.grade === "B" ? "success" : "neutral"}
            />
          ),
        },
        {
          key: "remark",
          title: "Remark",
          render: (row) => row.remark || "-",
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