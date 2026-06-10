"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import SectionCard from "../../../../components/ui/SectionCard";

import { getParentPortalOverview } from "../../../../lib/parent-portal";

export default function ParentResultsPage() {
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [children, setChildren] =
    useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res =
          await getParentPortalOverview();

        if (mounted) {
          setChildren(
            res?.children || []
          );
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data
              ?.message ||
              "Failed to load results"
          );
        } else {
          setError(
            "Failed to load results"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load results"
        description={error}
      />
    );
  }

  return (
    <div className="space-y-6">

      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 p-6">
        <h1 className="text-2xl font-bold text-white">
          Children Results
        </h1>

        <p className="mt-1 text-sm text-slate-300">
          Academic performance overview
        </p>
      </div>

      <SectionCard
        title="Academic Results"
        subtitle="Latest child performance"
      >
        <div className="space-y-4">

          {children.length === 0 ? (
            <EmptyState
              title="No Results"
              description="No student result records found."
            />
          ) : (
            children.map(
              (child: any) => (
                <div
                  key={child._id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-center justify-between">

                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {child.firstName}
                        {" "}
                        {child.lastName}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Admission:
                        {" "}
                        {child.admissionNumber}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Class:
                        {" "}
                        {child.className ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="text-right">

                      {child.latestResult ? (
                        <>
                          <p className="text-sm text-slate-400">
                            Latest Grade
                          </p>

                          <p className="text-2xl font-bold text-green-400">
                            {
                              child
                                .latestResult
                                ?.grade
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Total:
                            {" "}
                            {
                              child
                                .latestResult
                                ?.totalScore
                            }
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No result yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </SectionCard>
    </div>
  );
}