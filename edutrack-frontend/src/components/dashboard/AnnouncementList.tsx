// src/components/dashboard/AnnouncementList.tsx

"use client";

import { Announcement } from "../../types/announcement";

type Props = {
  announcements?: Announcement[];
  items?: Announcement[];
  loading?: boolean;
};

export default function AnnouncementList({
  announcements,
  items,
  loading = false,
}: Props) {
  const data = announcements || items || [];

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-6">
        Loading announcements...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
        No announcements available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((announcement) => (
        <div
          key={announcement._id}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {announcement.title}
            </h3>

            {announcement.target && (
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                {announcement.target}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-gray-600">
            {announcement.message}
          </p>

          {announcement.className && (
            <div className="mt-2 text-xs text-gray-500">
              Class: {announcement.className}
            </div>
          )}

          {announcement.createdAt && (
            <div className="mt-2 text-xs text-gray-400">
              {new Date(announcement.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}