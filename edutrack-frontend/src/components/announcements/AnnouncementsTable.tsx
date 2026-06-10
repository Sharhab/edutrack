"use client";

import { Announcement } from "../../types/announcement";
import EmptyState from "../../components/ui/EmptyState";
import { Pencil, Trash2 } from "lucide-react";

type AnnouncementsTableProps = {
  data: Announcement[];
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void | Promise<void>;
};

export default function AnnouncementsTable({
  data,
  onEdit,
  onDelete,
}: AnnouncementsTableProps) {
  if (!data.length) {
    return (
      <EmptyState
        title="No announcements yet"
        description="Create your first school notice to see it here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div
          key={item._id}
          className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-sm text-slate-400">{item.message}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
              Target: {item.target}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              onClick={() => onDelete(item)}
              className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}