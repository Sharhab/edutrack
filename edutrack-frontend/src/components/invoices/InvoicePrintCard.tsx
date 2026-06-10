"use client";

import { Invoice } from "@/types/invoice";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import { formatDate } from "@/lib/utils";

type InvoicePrintCardProps = {
  invoice: Invoice;
};

export default function InvoicePrintCard({ invoice }: InvoicePrintCardProps) {
  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#0b1220] p-8 text-white print:border print:border-slate-300 print:bg-white print:text-black">
      <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 print:border-slate-300 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 font-bold text-white print:bg-slate-900">
            ET
          </div>
          <h1 className="text-3xl font-black">EduTrack Invoice</h1>
          <p className="mt-2 text-sm text-slate-400 print:text-slate-600">
            Premium school management SaaS billing receipt
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p>
            <span className="text-slate-400 print:text-slate-600">Invoice:</span>{" "}
            <span className="font-semibold">{invoice.invoiceNumber}</span>
          </p>
          <p>
            <span className="text-slate-400 print:text-slate-600">Reference:</span>{" "}
            <span className="font-semibold">{invoice.reference || "-"}</span>
          </p>
          <div className="pt-1">
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-b border-white/10 pb-6 print:border-slate-300 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400 print:text-slate-600">
            Bill To
          </p>
          <p className="text-lg font-semibold">{invoice.schoolName || "-"}</p>
          <p className="mt-2 text-sm text-slate-400 print:text-slate-600">
            Tenant ID: {invoice.tenantId}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400 print:text-slate-600">
            Invoice Details
          </p>
          <div className="space-y-2 text-sm">
            <p>Plan: <span className="font-semibold capitalize">{invoice.plan}</span></p>
            <p>Cycle: <span className="font-semibold capitalize">{invoice.billingCycle}</span></p>
            <p>Issued: <span className="font-semibold">{formatDate(invoice.issuedAt)}</span></p>
            <p>Due: <span className="font-semibold">{formatDate(invoice.dueDate)}</span></p>
            <p>Paid: <span className="font-semibold">{formatDate(invoice.paidAt)}</span></p>
          </div>
        </div>
      </div>

      <div className="my-8 overflow-hidden rounded-2xl border border-white/10 print:border-slate-300">
        <div className="grid grid-cols-4 gap-4 bg-white/[0.03] px-4 py-3 text-sm font-semibold print:bg-slate-100">
          <div className="col-span-2">Description</div>
          <div>Plan</div>
          <div className="text-right">Amount</div>
        </div>

        <div className="grid grid-cols-4 gap-4 px-4 py-4 text-sm">
          <div className="col-span-2">
            {invoice.description || "EduTrack subscription invoice"}
          </div>
          <div className="capitalize">{invoice.plan}</div>
          <div className="text-right font-semibold">
            ₦{invoice.amount.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-full max-w-sm space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 print:border-slate-300 print:bg-slate-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 print:text-slate-600">Subtotal</span>
            <span>₦{invoice.amount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 print:text-slate-600">Tax</span>
            <span>₦0</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-lg font-bold print:border-slate-300">
            <span>Total</span>
            <span>₦{invoice.amount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}