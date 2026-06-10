"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import SectionCard from "@/components/ui/SectionCard";
import InvoicePrintCard from "@/components/invoices/InvoicePrintCard";
import { getInvoiceDetails } from "@/lib/invoices";
import { Invoice } from "@/types/invoice";

export default function InvoiceDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  async function loadInvoice() {
    try {
      setLoading(true);
      setPageError("");

      const data = await getInvoiceDetails(params.id);
      setInvoice(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message || "Failed to load invoice."
        );
      } else {
        setPageError("Failed to load invoice.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  if (loading) return <PageLoader />;

  if (pageError || !invoice) {
    return (
      <EmptyState
        title="Unable to load invoice"
        description={pageError || "Invoice not found."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Invoice Details"
        subtitle="Print-ready invoice and payment receipt"
      >
        <div className="mb-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => window.print()} className="btn-primary">
            Print / Save PDF
          </button>

          <button
            type="button"
            onClick={() => router.push("/super-admin/invoices")}
            className="btn-secondary"
          >
            Back to Invoices
          </button>
        </div>

        <InvoicePrintCard invoice={invoice} />
      </SectionCard>
    </div>
  );
}