"use client";

import EmptyState from "../../components/ui/EmptyState";
import { TeacherPortalAnnouncement } from "../../types/teacher-portal";

type TeacherAnnouncementsListProps = {
  items: TeacherPortalAnnouncement[];
};

function formatDate(date?: string) {
  if (!date) return "No date";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";

  return parsed.toLocaleDateString();
}

export default function TeacherAnnouncementsList({
  items,
}: TeacherAnnouncementsListProps) {
  if (!items.length) {
    return (
      <EmptyState
        title="No announcements"
        description="School announcements will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item._id}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="font-semibold text-white">{item.title}</h4>
              <p className="mt-1 text-sm text-slate-400">{item.message}</p>
            </div>

            <span className="text-xs text-slate-500">
              {formatDate(item.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}