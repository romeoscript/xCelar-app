import { api } from './api';

export type VehicleType = 'BACKPACK' | 'BIKE' | 'CAR' | 'TRUCK';
export type VehicleOwnership = 'PERSONAL' | 'COMPANY';
export type RiderStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RiderDocumentType =
  | 'DRIVER_PHOTO'
  | 'ID_FRONT'
  | 'ID_BACK'
  | 'VEHICLE_REGISTRATION'
  | 'INSURANCE'
  | 'ROAD_WORTHINESS';

export type RiderProfile = {
  id: string;
  vehicleType: VehicleType;
  vehicleOwnership: VehicleOwnership | null;
  city: string;
  status: RiderStatus;
  rejectionReason: string | null;
  isAvailable: boolean;
  documents: { type: RiderDocumentType; url: string | null }[];
};

export type DeliveryParty = {
  name: string | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export type RiderDelivery = {
  id: string;
  status: string;
  trackingCode: string | null;
  packageCategory: string | null;
  description: string | null;
  feeNaira: number | null;
  distanceKm: number | null;
  pickup: DeliveryParty;
  dropoff: DeliveryParty;
  acceptedAt: string | null;
  arrivedPickupAt: string | null;
  arrivedDropoffAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  proofUrl: string | null;
  paymentMethod: string | null;
};

export async function applyAsRider(input: {
  vehicleType: VehicleType;
  vehicleOwnership: VehicleOwnership;
  city: string;
}): Promise<RiderProfile> {
  const { data } = await api.post<{ profile: RiderProfile }>('/rider/apply', input);
  return data.profile;
}

export async function getMyRiderProfile(): Promise<RiderProfile | null> {
  const { data } = await api.get<{ profile: RiderProfile | null }>('/rider/me');
  return data.profile;
}

/** Go on/off shift. Returns the updated profile so the cache can reflect it. */
export async function setAvailability(available: boolean): Promise<RiderProfile> {
  const { data } = await api.patch<{ profile: RiderProfile }>('/rider/availability', { available });
  return data.profile;
}

export async function uploadRiderDocument(input: {
  type: RiderDocumentType;
  fileKey: string;
}): Promise<RiderProfile> {
  const { data } = await api.post<{ profile: RiderProfile }>('/rider/documents', input);
  return data.profile;
}

export async function getAvailableDeliveries(lat: number, lng: number): Promise<RiderDelivery[]> {
  const { data } = await api.get<RiderDelivery[]>('/rider/deliveries/available', {
    params: { lat, lng },
  });
  return data;
}

export async function acceptDelivery(id: string): Promise<RiderDelivery> {
  const { data } = await api.post<RiderDelivery>(`/rider/deliveries/${id}/accept`);
  return data;
}

/** Pass on an available delivery so it stops appearing in this rider's feed. */
export async function rejectDelivery(id: string): Promise<void> {
  await api.post(`/rider/deliveries/${id}/reject`);
}

export async function getAvailableDelivery(id: string): Promise<RiderDelivery> {
  const { data } = await api.get<RiderDelivery>(`/rider/deliveries/${id}/preview`);
  return data;
}

/** Report arriving at a stop (pickup while CONFIRMED, dropoff while IN_TRANSIT). */
export async function markArrived(id: string, stop: 'pickup' | 'dropoff'): Promise<RiderDelivery> {
  const { data } = await api.post<RiderDelivery>(`/rider/deliveries/${id}/arrive`, { stop });
  return data;
}

export async function pickupDelivery(id: string): Promise<RiderDelivery> {
  const { data } = await api.post<RiderDelivery>(`/rider/deliveries/${id}/pickup`);
  return data;
}

export async function completeDelivery(id: string, proofImageKey?: string): Promise<RiderDelivery> {
  const { data } = await api.post<RiderDelivery>(`/rider/deliveries/${id}/complete`, {
    ...(proofImageKey ? { proofImageKey } : {}),
  });
  return data;
}

export async function getMyDeliveries(): Promise<RiderDelivery[]> {
  const { data } = await api.get<RiderDelivery[]>('/rider/deliveries');
  return data;
}

/** Report the rider's live position on an active delivery, for customer tracking. */
export async function reportDeliveryLocation(id: string, lat: number, lng: number): Promise<void> {
  await api.post(`/rider/deliveries/${id}/location`, { lat, lng });
}

export async function getDelivery(id: string): Promise<RiderDelivery> {
  const { data } = await api.get<RiderDelivery>(`/rider/deliveries/${id}`);
  return data;
}

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  BACKPACK: 'Backpack',
  BIKE: 'Bike',
  CAR: 'Car',
  TRUCK: 'Van',
};

export const DOCUMENT_LABELS: Record<RiderDocumentType, string> = {
  DRIVER_PHOTO: 'Driver photo',
  ID_FRONT: 'ID card (front)',
  ID_BACK: 'ID card (back)',
  VEHICLE_REGISTRATION: 'Vehicle registration',
  INSURANCE: 'Insurance policy',
  ROAD_WORTHINESS: 'Road worthiness',
};
