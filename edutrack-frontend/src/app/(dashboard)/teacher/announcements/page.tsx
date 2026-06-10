"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import SectionCard from "../../../../components/ui/SectionCard";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import TeacherAnnouncementsList from "../../../../components/teacher/TeacherAnnouncementsList";
import { getTeacherPortalOverview } from "../../../../lib/teacher-portal";
import { TeacherPortalAnnouncement } from "../../../../types/teacher-portal";

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<TeacherPortalAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  async function loadAnnouncements() {
    try {
      setLoading(true);
      setPageError("");

      const data = await getTeacherPortalOverview();
      setAnnouncements(data.announcements);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message || "Failed to load announcements."
        );
      } else {
        setPageError("Failed to load announcements.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load announcements"
        description={pageError}
      />
    );
  }

  return (
    <SectionCard
      title="Announcements"
      subtitle="Latest updates for teachers"
    >
      <TeacherAnnouncementsList items={announcements} />
    </SectionCard>
  );
}