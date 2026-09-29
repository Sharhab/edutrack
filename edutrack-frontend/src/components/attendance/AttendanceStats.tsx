import StatCard from "../../components/ui/statCard";
import { AttendanceSummary } from "../../types/attendance";

type AttendanceStatsProps = {
  summary: AttendanceSummary;
};

export default function AttendanceStats({
  summary,
}: AttendanceStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Records"
        value={summary.total}
        subtitle="Attendance entries returned"
      />
      <StatCard
        title="Present"
        value={summary.present}
        subtitle="Students marked present"
      />
      <StatCard
        title="Absent"
        value={summary.absent}
        subtitle="Students marked absent"
      />
      <StatCard
        title="Attendance Rate"
        value={`${summary.attendanceRate}%`}
        subtitle="Overall attendance performance"
      />
    </div>
  );
}