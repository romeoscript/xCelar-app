import { api } from './api';

export type ShipmentType = 'LOCAL' | 'EXPORT' | 'IMPORT';

export type ShipmentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type Shipment = {
  id: string;
  type: ShipmentType;
  status: ShipmentStatus;
  currentStep: number;
  senderName: string | null;
  senderPhone: string | null;
  senderAddress: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  packageCategory: string | null;
  weightKg: number | null;
  description: string | null;
  declaredValue: number | null;
  priceEstimate: number | null;
  trackingCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentUpdate = Partial<{
  currentStep: number;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  packageCategory: string;
  weightKg: number;
  description: string;
  declaredValue: number;
}>;

export async function createDraft(type: ShipmentType): Promise<Shipment> {
  const { data } = await api.post<Shipment>('/shipments', { type });
  return data;
}

export async function getOpenDraft(type: ShipmentType): Promise<Shipment | null> {
  const { data } = await api.get<{ shipment: Shipment | null }>('/shipments/draft', {
    params: { type },
  });
  return data.shipment;
}

export async function getShipment(id: string): Promise<Shipment> {
  const { data } = await api.get<Shipment>(`/shipments/${id}`);
  return data;
}

export async function updateShipment(id: string, update: ShipmentUpdate): Promise<Shipment> {
  const { data } = await api.patch<Shipment>(`/shipments/${id}`, update);
  return data;
}

export async function confirmShipment(id: string): Promise<Shipment> {
  const { data } = await api.post<Shipment>(`/shipments/${id}/confirm`);
  return data;
}

export async function discardShipment(id: string): Promise<void> {
  await api.delete(`/shipments/${id}`);
}
