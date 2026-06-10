"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import SectionCard from "../../../../components/ui/SectionCard";
import PaymentResultCard from "../../../../components/billing/PaymentResultCard";
import { verifyPaystackPayment } from "../../../../lib/paystack";
import { VerifyPaystackResponse } from "../../../../types/paystack";

export default function BillingCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || "";

  const [data, setData] = useState<VerifyPaystackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    async function verify() {
      if (!reference) {
        setPageError("Payment reference was not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError("");

        const result = await verifyPaystackPayment(reference);
        setData(result);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setPageError(
            err.response?.data?.message || "Failed to verify payment."
          );
        } else {
          setPageError("Failed to verify payment.");
        }
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [reference]);

  if (loading) {
    return <PageLoader />;
  }

  if (pageError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          title="Unable to verify payment"
          description={pageError}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          title="No payment result found"
          description="Payment verification returned no result."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <PaymentResultCard data={data} />

      <SectionCard
        title="Next Action"
        subtitle="Continue managing tenant billing"
      >
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/super-admin/billing")}
            className="btn-primary"
          >
            Back to Billing
          </button>

          <button
            type="button"
            onClick={() => router.push("/super-admin/tenants")}
            className="btn-secondary"
          >
            View Tenants
          </button>
        </div>
      </SectionCard>
    </div>
  );
}