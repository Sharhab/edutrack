"use client";

import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import { ParentResult } from "../../types/parent-portal";

type ParentResultsTableProps = {
  data: ParentResult[];
};

export default function ParentResultsTable({
  data,
}: ParentResultsTableProps) {
  if (!data.length) {
    return (
      <EmptyState
        title="No results found"
        description="Results for this child will appear here when available."
      />
    );
  }

  return (
    <DataTable
      data={data}
      columns={[
        {
          key: "subject",
          title: "Subject",
          render: (row) => row.subjectName || "-",
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
          key: "ca",
          title: "CA",
          render: (row) => row.caScore,
        },
        {
          key: "exam",
          title: "Exam",
          render: (row) => row.examScore,
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
              variant={
                row.grade === "A" || row.grade === "B" ? "success" : "neutral"
              }
            />
          ),
        },
        {
          key: "remark",
          title: "Remark",
          render: (row) => row.remark || "-",
        },
      ]}
    />
  );
}