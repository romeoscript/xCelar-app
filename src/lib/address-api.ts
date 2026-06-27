import { api } from './api';

export type SavedAddress = {
  id: string;
  label: string | null;
  contactName: string;
  contactPhone: string;
  address: string;
  lat: number | null;
  lng: number | null;
  zone: string | null;
  createdAt: string;
};

export type SavedAddressInput = {
  label?: string;
  contactName: string;
  contactPhone: string;
  address: string;
  lat?: number;
  lng?: number;
  zone?: string;
};

export async function getSavedAddresses(): Promise<SavedAddress[]> {
  const { data } = await api.get<SavedAddress[]>('/addresses');
  return data;
}

export async function createSavedAddress(input: SavedAddressInput): Promise<SavedAddress> {
  const { data } = await api.post<SavedAddress>('/addresses', input);
  return data;
}

export async function deleteSavedAddress(id: string): Promise<void> {
  await api.delete(`/addresses/${id}`);
}
