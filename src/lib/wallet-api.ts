import { api } from './api';

export type VerifyResult = {
  purpose: string;
  success: boolean;
  /** Gateway status: 'success' | 'abandoned' | 'failed' | … */
  status?: string;
  balanceKobo?: number;
  shipmentId?: string | null;
};

export type PaymentInit = {
  authorizationUrl: string;
  reference: string;
};

export type Transaction = {
  id: string;
  reference: string;
  amountKobo: number;
  purpose: 'WALLET_TOPUP' | 'SHIPMENT';
  state: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
};

export async function getWalletBalance(): Promise<number> {
  const { data } = await api.get<{ balanceKobo: number }>('/wallet');
  return data.balanceKobo;
}

export async function getTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/wallet/transactions');
  return data;
}

export async function topupWallet(amount: number): Promise<PaymentInit> {
  const { data } = await api.post<PaymentInit>('/wallet/topup', { amount });
  return data;
}

export async function verifyPayment(reference: string): Promise<VerifyResult> {
  const { data } = await api.post<VerifyResult>('/payments/verify', { reference });
  return data;
}
