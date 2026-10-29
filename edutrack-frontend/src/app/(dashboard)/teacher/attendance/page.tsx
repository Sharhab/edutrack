
"use client";

import { ClipboardCheck, Info } from "lucide-react";
import { useTenant } from "../../../../components/tenant/TenantProvider";

export default function TeacherAttendancePage() {
  const { tenant } = useTenant();
  const brandColor = tenant?.themeColor || "#06b6d4";

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${brandColor}18`,
              color: brandColor,
            }}
          >
            <ClipboardCheck size={26} />
          </div>

          <div className="min-w-0">
            <p
              className="text-sm font-semibold"
              style={{ color: brandColor }}
            >
              {tenant?.schoolName || "EduTrack"}
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              Daily Class Attendance
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Daily class-register attendance is managed by the
              assigned Form Master for each class.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <Info
              className="mt-0.5 shrink-0 text-slate-500"
              size={20}
            />

            <div>
              <h2 className="font-semibold text-slate-900">
                Need to mark daily attendance?
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Open the Form Master dashboard if you have been
                assigned as a Form Master. If no Form Master has
                been assigned to your class, contact the School
                Admin.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
