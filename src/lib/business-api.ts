import { api } from '@/lib/api';
import type { PaymentInit } from '@/lib/wallet-api';

/** Shapes from xcellar-api's business module. Money is naira. */

export type BusinessStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type Business = {
  id: string;
  companyName: string;
  registrationNumber: string | null;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: BusinessStatus;
  statusReason: string | null;
  creditLimitNaira: number;
  paymentTermsDays: number;
  createdAt: string;
};

export type CreditSummary = {
  limitNaira: number;
  unpaidInvoicesNaira: number;
  unbilledNaira: number;
  availableNaira: number;
  overdueInvoices: number;
};

export type MyBusiness = { business: Business | null; credit: CreditSummary | null };

export type BusinessApplication = {
  companyName: string;
  registrationNumber?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
};

/** OVERDUE is worked out from the due date by the server. */
export type InvoiceState = 'UNPAID' | 'OVERDUE' | 'PAID' | 'VOID';

export type InvoiceSummary = {
  id: string;
  number: string;
  periodStart: string;
  totalNaira: number;
  state: InvoiceState;
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  deliveryCount: number;
};

export type InvoiceLine = {
  shipmentId: string;
  trackingCode: string | null;
  bookedAt: string | null;
  recipientName: string | null;
  deliveryZone: string | null;
  feeNaira: number;
};

export type InvoiceDetail = InvoiceSummary & {
  lines: InvoiceLine[];
  bank: { bankName: string | null; accountName: string | null; accountNumber: string | null };
};

export const BusinessQueryKeys = {
  mine: ['business'] as const,
  invoices: ['business-invoices'] as const,
  invoice: (id: string) => ['business-invoice', id] as const,
};

export async function getMyBusiness(): Promise<MyBusiness> {
  const { data } = await api.get<MyBusiness>('/business/me');
  return data;
}

export async function applyForBusiness(input: BusinessApplication): Promise<Business> {
  const { data } = await api.post<Business>('/business/apply', input);
  return data;
}

export async function getMyInvoices(): Promise<InvoiceSummary[]> {
  const { data } = await api.get<InvoiceSummary[]>('/business/invoices');
  return data;
}

export async function getMyInvoice(id: string): Promise<InvoiceDetail> {
  const { data } = await api.get<InvoiceDetail>(`/business/invoices/${id}`);
  return data;
}

/** Starts a Paystack checkout for the invoice's full total. */
export async function payInvoice(id: string): Promise<PaymentInit> {
  const { data } = await api.post<PaymentInit>(`/business/invoices/${id}/pay`);
  return data;
}

/** "October 2026" for an invoice period, in Lagos time like the server. */
export function invoicePeriodLabel(periodStart: string): string {
  return new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' }).format(
    new Date(periodStart),
  );
}

export function formatShortDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}
