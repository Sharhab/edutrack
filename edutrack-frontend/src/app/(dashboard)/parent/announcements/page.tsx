"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/axios";

export default function ParentAnnouncementsPage() {
  const [announcements, setAnnouncements] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      const res = await api.get(
        "/parent-portal/dashboard"
      );

      setAnnouncements(
        res.data?.data?.announcements || []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-white">
        Loading announcements...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      <div>
        <h1 className="text-2xl font-bold text-white">
          Announcements
        </h1>

        <p className="text-slate-400">
          School updates and notices
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          No announcements available
        </div>
      ) : (
        <div className="space-y-4">

          {announcements.map((item) => (
            <div
              key={item._id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="text-lg font-semibold text-white">
                {item.title}
              </h2>

              <p className="mt-2 text-slate-300">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}