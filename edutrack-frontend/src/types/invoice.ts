export type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled";

export interface Invoice {
  _id: string;
  tenantId: string;
  schoolName?: string;
  invoiceNumber: string;
  reference?: string;
  plan: "starter" | "standard" | "premium";
  amount: number;
  status: InvoiceStatus;
  billingCycle: "monthly" | "yearly";
  issuedAt?: string;
  dueDate?: string;
  paidAt?: string;
  description?: string;
  createdAt?: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
}

export interface InvoiceDetailsResponse {
  invoice: Invoice;
}

export interface InvoiceSummary {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
}