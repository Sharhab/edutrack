import api from "@/lib/axios";
import {
  Invoice,
  InvoiceDetailsResponse,
  InvoiceListResponse,
} from "@/types/invoice";

const INVOICE_ENDPOINTS = {
  list: "/super-admin/billing/invoices",
  details: (id: string) => `/super-admin/billing/invoices/${id}`,
};

export async function getInvoices(): Promise<Invoice[]> {
  const { data } = await api.get<InvoiceListResponse>(INVOICE_ENDPOINTS.list);
  return data.invoices || [];
}

export async function getInvoiceDetails(id: string): Promise<Invoice> {
  const { data } = await api.get<InvoiceDetailsResponse>(
    INVOICE_ENDPOINTS.details(id)
  );
  return data.invoice;
}