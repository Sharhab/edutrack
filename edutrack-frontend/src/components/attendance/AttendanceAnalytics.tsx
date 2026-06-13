type AttendanceAnalyticsProps = {
  total: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
};

export default function AttendanceAnalytics({
  total,
  present,
  absent,
  late,
  attendanceRate,
}: AttendanceAnalyticsProps) {
  const presentWidth =
    total > 0 ? (present / total) * 100 : 0;

  const absentWidth =
    total > 0 ? (absent / total) * 100 : 0;

  const lateWidth =
    total > 0 ? (late / total) * 100 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white">
          Attendance Distribution
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          Quick visual breakdown of present,
          absent, and late records.
        </p>

        <div className="mt-6 space-y-4">
          {/* PRESENT */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-300">
                Present
              </span>

              <span className="text-emerald-300">
                {present}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: `${presentWidth}%`,
                }}
              />
            </div>
          </div>

          {/* ABSENT */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-300">
                Absent
              </span>

              <span className="text-red-300">
                {absent}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-red-500"
                style={{
                  width: `${absentWidth}%`,
                }}
              />
            </div>
          </div>

          {/* LATE */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-300">
                Late
              </span>

              <span className="text-amber-300">
                {late}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{
                  width: `${lateWidth}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white">
          Attendance Performance
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          Overall attendance quality for the
          selected filters.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <div className="flex h-44 w-44 items-center justify-center rounded-full border-[12px] border-cyan-400/30 bg-white/[0.03]">
            <div className="text-center">
              <p className="text-4xl font-black text-white">
                {attendanceRate}%
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Attendance Rate
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
