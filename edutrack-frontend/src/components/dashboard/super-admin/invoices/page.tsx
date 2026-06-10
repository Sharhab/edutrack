"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SectionCard from "@/components/ui/SectionCard";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import FormInput from "@/components/ui/FormInput";
import InvoicesTable from "@/components/invoices/InvoicesTable";
import { getInvoices } from "@/lib/invoices";
import { Invoice } from "@/types/invoice";
import { Search } from "lucide-react";

export default function SuperAdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");

  async function loadInvoices() {
    try {
      setLoading(true);
      setPageError("");

      const data = await getInvoices();
      setInvoices(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message || "Failed to load invoices."
        );
      } else {
        setPageError("Failed to load invoices.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoices;

    const query = search.toLowerCase();

    return invoices.filter((invoice) => {
      return (
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        (invoice.schoolName || "").toLowerCase().includes(query) ||
        (invoice.reference || "").toLowerCase().includes(query) ||
        invoice.plan.toLowerCase().includes(query)
      );
    });
  }, [invoices, search]);

  if (loading) return <PageLoader />;

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load invoices"
        description={pageError}
      />
    );
  }

  return (
    <SectionCard
      title="Invoices"
      subtitle="View and manage generated billing receipts and invoices"
    >
      <div className="mb-5">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-11 text-slate-400"
          />
          <div className="[&_input]:pl-11">
            <FormInput
              label="Search Invoices"
              name="search"
              value={search}
              placeholder="Search by invoice no, school, plan..."
              onChange={setSearch}
            />
          </div>
        </div>
      </div>

      <InvoicesTable data={filteredInvoices} />
    </SectionCard>
  );
}