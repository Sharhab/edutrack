"use client";

import EmptyState from "../../components/ui/EmptyState";
import { ParentChild } from "../../types/parent-portal";

type ChildrenCardsProps = {
  childrenList: ParentChild[];
  selectedChildId: string;
  onSelect: (childId: string) => void;
};

export default function ChildrenCards({
  childrenList,
  selectedChildId,
  onSelect,
}: ChildrenCardsProps) {
  if (!childrenList.length) {
    return (
      <EmptyState
        title="No children linked"
        description="Once children are linked to this parent account, they will appear here."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {childrenList.map((child) => {
        const active = selectedChildId === child._id;

        return (
          <button
            key={child._id}
            type="button"
            onClick={() => onSelect(child._id)}
            className={`card p-5 text-left transition ${
              active
                ? "ring-1 ring-cyan-400/40 bg-white/[0.08]"
                : "hover:bg-white/[0.07]"
            }`}
          >
            <p className="text-lg font-semibold text-white">
              {child.firstName} {child.lastName}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {child.className || "No class assigned"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                {child.admissionNumber || "No admission no."}
              </span>

              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                Attendance:{" "}
                {child.attendanceRate !== undefined
                  ? `${child.attendanceRate}%`
                  : "-"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}