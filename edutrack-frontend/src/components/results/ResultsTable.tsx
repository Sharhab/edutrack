
"use client";

import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import type {
  ResultRecord,
  ResultRelation,
  ResultStudent,
  ResultClass,
  ResultSubject,
  ResultAcademicPeriod,
} from "../../types/result";
import { formatDate } from "../../lib/utils";
import { Pencil, Trash2 } from "lucide-react";

type ResultsTableProps = {
  data: ResultRecord[];
  onEdit: (result: ResultRecord) => void;
  onDelete: (result: ResultRecord) => void;
};

function getRelation<T extends { _id: string }>(
  relation: ResultRelation<T> | null | undefined,
): T | null {
  if (
    relation &&
    typeof relation === "object" &&
    "_id" in relation
  ) {
    return relation;
  }

  return null;
}

function getStudentName(row: ResultRecord): string {
  const student = getRelation<ResultStudent>(row.studentId);

  if (student) {
    return [student.firstName, student.lastName]
      .filter(Boolean)
      .join(" ") || "-";
  }

  return row.studentName || "-";
}

function getClassName(row: ResultRecord): string {
  const classItem = getRelation<ResultClass>(row.classId);
  return classItem?.name || row.className || "-";
}

function getSubjectName(row: ResultRecord): string {
  const subject = getRelation<ResultSubject>(row.subjectId);

  return (
    subject?.name ||
    row.subjectName ||
    subject?.code ||
    row.subjectCode ||
    "-"
  );
}

function getSessionName(row: ResultRecord): string {
  const session = getRelation<ResultAcademicPeriod>(row.sessionId);
  return session?.name || row.sessionName || "-";
}

function getTermName(row: ResultRecord): string {
  const term = getRelation<ResultAcademicPeriod>(row.termId);
  return term?.name || row.termName || "-";
}

function displayScore(value: number | null | undefined): string {
  return value == null ? "-" : String(value);
}

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
            <div className="min-w-[140px]">
              <p className="font-semibold text-white">
                {getStudentName(row)}
              </p>

              <p className="text-xs text-slate-400">
                {getClassName(row)}
              </p>

              {row.admissionNumber && (
                <p className="text-xs text-slate-500">
                  {row.admissionNumber}
                </p>
              )}
            </div>
          ),
        },
        {
          key: "subject",
          title: "Subject",
          render: (row) => (
            <span className="text-slate-200">
              {getSubjectName(row)}
            </span>
          ),
        },
        {
          key: "session",
          title: "Session",
          render: (row) => getSessionName(row),
        },
        {
          key: "term",
          title: "Term",
          render: (row) => getTermName(row),
        },
        {
          key: "scores",
          title: "Scores",
          render: (row) => {
            const components =
              row.assessmentScheme?.components ?? [];

            const hasDynamicScores =
              components.length > 0 &&
              row.scores != null &&
              Object.keys(row.scores).length > 0;

            if (hasDynamicScores) {
              return (
                <div className="min-w-[130px] space-y-1">
                  {components.map((component) => (
                    <p
                      key={component.key}
                      className="text-sm text-slate-200"
                    >
                      {component.label}:{" "}
                      {displayScore(
                        row.scores?.[component.key],
                      )}
                      <span className="text-slate-500">
                        {" "}/ {component.maxScore}
                      </span>
                    </p>
                  ))}
                </div>
              );
            }

            return (
              <div className="min-w-[130px] space-y-1">
                <p className="text-sm text-slate-200">
                  CA1: {displayScore(row.ca1)}
                </p>
                <p className="text-sm text-slate-200">
                  CA2: {displayScore(row.ca2)}
                </p>
                <p className="text-sm text-slate-200">
                  Assignment: {displayScore(row.assignment)}
                </p>
                <p className="text-sm text-slate-400">
                  Exam: {displayScore(row.exam)}
                </p>
              </div>
            );
          },
        },
        {
          key: "total",
          title: "Total",
          render: (row) => (
            <span className="font-semibold text-white">
              {displayScore(row.total)}
            </span>
          ),
        },
        {
          key: "grade",
          title: "Grade",
          render: (row) => (
            <Badge
              label={row.grade || "-"}
              variant={
                row.grade === "A" || row.grade === "B"
                  ? "success"
                  : "neutral"
              }
            />
          ),
        },
        {
          key: "remark",
          title: "Remark",
          render: (row) => row.remark || "-",
        },
        {
          key: "status",
          title: "Status",
          render: (row) => (
            <Badge
              label={row.status || "draft"}
              variant={
                row.status === "published"
                  ? "success"
                  : "neutral"
              }
            />
          ),
        },
        {
          key: "createdAt",
          title: "Created",
          render: (row) =>
            row.createdAt ? formatDate(row.createdAt) : "-",
        },
        {
          key: "actions",
          title: "Actions",
          render: (row) => {
            const isReadOnly =
              row.status === "published" ||
              row.status === "locked";

            return (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  disabled={isReadOnly}
                  aria-label="Edit result"
                  title={
                    isReadOnly
                      ? "Published or locked results cannot be edited"
                      : "Edit result"
                  }
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  disabled={isReadOnly}
                  aria-label="Delete result"
                  title={
                    isReadOnly
                      ? "Published or locked results cannot be deleted"
                      : "Delete result"
                  }
                  className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          },
        },
      ]}
    />
  );
}
