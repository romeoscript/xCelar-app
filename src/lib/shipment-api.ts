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
  senderIsSelf: boolean | null;
  senderName: string | null;
  senderPhone: string | null;
  senderAddress: string | null;
  senderLat: number | null;
  senderLng: number | null;
  pickupZone: string | null;
  pickupDate: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  receiverLat: number | null;
  receiverLng: number | null;
  deliveryZone: string | null;
  packageCategory: string | null;
  weightKg: number | null;
  description: string | null;
  declaredValue: number | null;
  fragile: boolean;
  priceEstimate: number | null;
  trackingCode: string | null;
  paid: boolean;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentUpdate = Partial<{
  currentStep: number;
  senderIsSelf: boolean;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderLat: number;
  senderLng: number;
  pickupZone: string;
  pickupDate: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverLat: number;
  receiverLng: number;
  deliveryZone: string;
  packageCategory: string;
  weightKg: number;
  description: string;
  declaredValue: number;
  fragile: boolean;
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

export async function getShipments(): Promise<Shipment[]> {
  const { data } = await api.get<Shipment[]>('/shipments');
  return data;
}

export async function getShipmentByTracking(code: string): Promise<Shipment> {
  const { data } = await api.get<Shipment>(`/shipments/track/${encodeURIComponent(code)}`);
  return data;
}

export type Currency = 'NGN' | 'USD';

export type PriceBreakdown = {
  baseFare: number;
  distanceKm: number;
  distanceFee: number;
  weightFee: number;
  fragileSurcharge: number;
  subtotal: number;
  vatPercent: number;
  vat: number;
  total: number;
  currency: Currency;
  minDays: number;
  maxDays: number;
};

export async function getShipmentBreakdown(id: string): Promise<PriceBreakdown | null> {
  const { data } = await api.get<PriceBreakdown | null>(`/shipments/${id}/breakdown`);
  return data;
}

/** LOCAL is priced by distance; EXPORT/IMPORT by destination/origin country. */
export type QuoteMode = ShipmentType;

export type QuoteInput = {
  mode: QuoteMode;
  weightKg: number;
  fragile?: boolean;
  /** ISO-2 country code, for EXPORT/IMPORT modes. */
  country?: string;
  senderLat?: number;
  senderLng?: number;
  receiverLat?: number;
  receiverLng?: number;
};

/** Price estimate for arbitrary inputs, without creating a shipment. */
export async function getQuote(input: QuoteInput): Promise<PriceBreakdown> {
  const { data } = await api.post<PriceBreakdown>('/shipments/quote', input);
  return data;
}

export type RateCountry = {
  code: string;
  name: string;
};

/** Countries we ship to (EXPORT) or from (IMPORT), for the quote picker. */
export async function getQuoteCountries(direction: 'EXPORT' | 'IMPORT'): Promise<RateCountry[]> {
  const { data } = await api.get<RateCountry[]>('/shipments/rates/countries', {
    params: { direction },
  });
  return data;
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

export async function payWithBalance(id: string, termsAccepted: boolean): Promise<Shipment> {
  const { data } = await api.post<Shipment>(`/shipments/${id}/pay`, {
    method: 'balance',
    termsAccepted,
  });
  return data;
}

export async function initPaystackForShipment(
  id: string,
  termsAccepted: boolean,
): Promise<{ authorizationUrl: string; reference: string }> {
  const { data } = await api.post<{ authorizationUrl: string; reference: string }>(
    `/shipments/${id}/pay`,
    { method: 'paystack', termsAccepted },
  );
  return data;
}
