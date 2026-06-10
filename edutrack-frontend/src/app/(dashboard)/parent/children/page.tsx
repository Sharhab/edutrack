"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SectionCard from "../../../../components/ui/SectionCard";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import ChildrenCards from "../../../../components/parent/ChildrenCards";
import ParentResultsTable from "../../../../components/parent/ParentResultsTable";
import ParentAnnouncementsList from "../../../../components/parent/ParentAnnouncementsList";
import {
  getParentChildResults,
  getParentPortalOverview,
} from "../../../../lib/parent-portal";
import {
  ParentAnnouncement,
  ParentChild,
  ParentResult,
} from "../../../../types/parent-portal";

export default function ParentChildrenPage() {
  const [childrenList, setChildrenList] = useState<ParentChild[]>([]);
  const [announcements, setAnnouncements] = useState<ParentAnnouncement[]>([]);
  const [results, setResults] = useState<ParentResult[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");

  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [resultsError, setResultsError] = useState("");

  async function loadOverview() {
    try {
      setLoading(true);
      setPageError("");

      const data = await getParentPortalOverview();

      setChildrenList(data.children);
      setAnnouncements(data.announcements);

      if (data.children.length > 0) {
        setSelectedChildId(data.children[0]._id);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message ||
            "Failed to load parent portal information."
        );
      } else {
        setPageError("Failed to load parent portal information.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadChildResults(childId: string) {
    try {
      setResultsLoading(true);
      setResultsError("");

      const data = await getParentChildResults(childId);
      setResults(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setResultsError(
          err.response?.data?.message || "Failed to load child results."
        );
      } else {
        setResultsError("Failed to load child results.");
      }
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadChildResults(selectedChildId);
    }
  }, [selectedChildId]);

  const selectedChild = useMemo(() => {
    return childrenList.find((child) => child._id === selectedChildId) || null;
  }, [childrenList, selectedChildId]);

  if (loading) {
    return <PageLoader />;
  }

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load parent portal"
        description={pageError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="My Children"
        subtitle="Select a child to view academic records and attendance summary"
      >
        <ChildrenCards
          childrenList={childrenList}
          selectedChildId={selectedChildId}
          onSelect={setSelectedChildId}
        />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title={
              selectedChild
                ? `${selectedChild.firstName} ${selectedChild.lastName} Results`
                : "Child Results"
            }
            subtitle="Academic performance records"
          >
            {resultsLoading ? (
              <PageLoader />
            ) : resultsError ? (
              <EmptyState
                title="Unable to load results"
                description={resultsError}
              />
            ) : (
              <ParentResultsTable data={results} />
            )}
          </SectionCard>
        </div>

        <div className="xl:col-span-1">
          <SectionCard
            title="Announcements"
            subtitle="Latest updates from the school"
          >
            <ParentAnnouncementsList items={announcements} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}