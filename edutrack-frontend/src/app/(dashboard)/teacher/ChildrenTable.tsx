import DataTable from "../../../components/ui/DataTable";
import EmptyState from "../../../components/ui/EmptyState";
import { ParentChildSummary } from "../../../types/dashboard";

type ChildrenTableProps = {
  data: ParentChildSummary[];
};

export default function ChildrenTable({ data }: ChildrenTableProps) {
  if (!data?.length) {
    return (
      <EmptyState
        title="No linked children found"
        description="Once children are linked to this parent account, they will appear here."
      />
    );
  }

  return (
    <DataTable<ParentChildSummary>
      data={data}
      columns={[
        {
          key: "name",
          title: "Student Name",
          render: (row) => row.name,
        },
        {
          key: "className",
          title: "Class",
          render: (row) => row.className || "-",
        },
        {
          key: "attendanceRate",
          title: "Attendance",
          render: (row) =>
            row.attendanceRate !== undefined ? `${row.attendanceRate}%` : "-",
        },
        {
          key: "latestResultStatus",
          title: "Latest Result",
          render: (row) => row.latestResultStatus || "-",
        },
      ]}
    />
  );
}