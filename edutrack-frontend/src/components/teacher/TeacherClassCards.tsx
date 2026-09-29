"use client";

import EmptyState from "../../components/ui/EmptyState";
import { TeacherAssignedClass } from "../../types/teacher-portal";

type TeacherClassCardsProps = {
  classes: TeacherAssignedClass[];
  selectedClassId: string;
  onSelect: (classId: string) => void;
};

export default function TeacherClassCards({
  classes,
  selectedClassId,
  onSelect,
}: TeacherClassCardsProps) {
  if (!classes.length) {
    return (
      <EmptyState
        title="No assigned classes"
        description="Assigned classes will appear here for this teacher."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {classes.map((item) => {
        const active = selectedClassId === item._id;

        return (
          <button
            key={item._id}
            type="button"
            onClick={() => onSelect(item._id)}
            className={`card p-5 text-left transition ${
              active
                ? "ring-1 ring-cyan-400/40 bg-white/[0.08]"
                : "hover:bg-white/[0.07]"
            }`}
          >
            <p className="text-lg font-semibold text-white">
              {item.name}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {item.subjectName ?? "No subject assigned"}
            </p>

            <div className="mt-4">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                Students: {item.studentsCount ?? 0}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}