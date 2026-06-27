import { api } from './api';

export type VerifyResult = {
  purpose: string;
  success: boolean;
  balanceKobo?: number;
  shipmentId?: string | null;
};

export type PaymentInit = {
  authorizationUrl: string;
  reference: string;
};

export async function getWalletBalance(): Promise<number> {
  const { data } = await api.get<{ balanceKobo: number }>('/wallet');
  return data.balanceKobo;
}

export async function topupWallet(amount: number): Promise<PaymentInit> {
  const { data } = await api.post<PaymentInit>('/wallet/topup', { amount });
  return data;
}

export async function verifyPayment(reference: string): Promise<VerifyResult> {
  const { data } = await api.post<VerifyResult>('/payments/verify', { reference });
  return data;
}
