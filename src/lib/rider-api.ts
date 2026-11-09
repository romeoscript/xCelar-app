import { api } from './api';
import type { DeliveryStage } from './shipment-api';

export type { DeliveryStage };

export type VehicleType = 'BACKPACK' | 'BIKE' | 'CAR' | 'TRUCK';
export type VehicleOwnership = 'PERSONAL' | 'COMPANY';
export type RiderProfile = {
  id: string;
  /** Staff-issued rider ID, e.g. R-04418-062. */
  riderCode: string;
  type: 'RIDER' | 'HEAD_RIDER';
  vehicleType: VehicleType;
  vehicleOwnership: VehicleOwnership | null;
  city: string;
  isAvailable: boolean;
  /** Taken off dispatch by a manager: can't go online or receive deliveries. */
  isSuspended: boolean;
  suspendedReason: string | null;
};

/** The stretch of the journey a rider is responsible for. */
export type RiderLeg = 'PICKUP' | 'DELIVERY' | 'RETURN';

export type Stop = {
  kind: 'SENDER' | 'HUB' | 'RECIPIENT';
  name: string | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

/** One leg of a delivery as the rider sees it (`RiderJob` in xcellar-api). */
export type RiderJob = {
  id: string;
  trackingCode: string | null;
  stage: DeliveryStage;
  leg: RiderLeg;
  /** True while this rider holds the parcel on this leg. */
  isActive: boolean;
  packageCategory: string | null;
  description: string | null;
  fragile: boolean;
  feeNaira: number | null;
  /** Cash to collect at the drop-off; null when prepaid. */
  cashToCollectNaira: number | null;
  from: Stop;
  to: Stop;
  /** When the rider reached the customer on this leg. */
  arrivedAt: string | null;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  proofUrl: string | null;
};

export async function getMyRiderProfile(): Promise<RiderProfile | null> {
  const { data } = await api.get<{ profile: RiderProfile | null }>('/rider/me');
  return data.profile;
}

/** Go on/off shift. Returns the updated profile so the cache can reflect it. */
export async function setAvailability(available: boolean): Promise<RiderProfile> {
  const { data } = await api.patch<{ profile: RiderProfile }>('/rider/availability', { available });
  return data.profile;
}

export type DeliveryProblemReason =
  | 'WRONG_ADDRESS'
  | 'RECIPIENT_UNAVAILABLE'
  | 'CANNOT_REACH'
  | 'PACKAGE_ISSUE'
  | 'PAYMENT_REFUSED'
  | 'OTHER';

/** The job can't go ahead. A pickup goes back to dispatch; a delivery attempt
 *  fails and the rider brings the parcel back to the hub. */
export async function reportDeliveryProblem(
  id: string,
  reason: DeliveryProblemReason,
  note?: string,
): Promise<void> {
  await api.post(`/rider/deliveries/${id}/report`, { reason, ...(note ? { note } : {}) });
}

/** Report reaching the customer on this leg (sender, or recipient on a delivery). */
export async function markArrived(id: string): Promise<RiderJob> {
  const { data } = await api.post<RiderJob>(`/rider/deliveries/${id}/arrive`);
  return data;
}

/** Pickup leg: the parcel is collected and on its way to the hub. */
export async function collectParcel(id: string): Promise<RiderJob> {
  const { data } = await api.post<RiderJob>(`/rider/deliveries/${id}/pickup`);
  return data;
}

/** Finish a delivery or return with a proof photo. Cash jobs need `cashCollected`. */
export async function completeLeg(
  id: string,
  input: { proofImageKey: string; cashCollected?: boolean },
): Promise<RiderJob> {
  const { data } = await api.post<RiderJob>(`/rider/deliveries/${id}/complete`, input);
  return data;
}

export async function getMyDeliveries(): Promise<RiderJob[]> {
  const { data } = await api.get<RiderJob[]>('/rider/deliveries');
  return data;
}

/** Report the rider's live position on an active delivery, for customer tracking. */
export async function reportDeliveryLocation(id: string, lat: number, lng: number): Promise<void> {
  await api.post(`/rider/deliveries/${id}/location`, { lat, lng });
}

/** Report the rider's position while on shift and idle, so dispatch can see
 *  who is close to a pickup. The server ignores it while offline. */
export async function reportShiftLocation(lat: number, lng: number): Promise<void> {
  await api.post('/rider/location', { lat, lng });
}

export async function getDelivery(id: string): Promise<RiderJob> {
  const { data } = await api.get<RiderJob>(`/rider/deliveries/${id}`);
  return data;
}

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  BACKPACK: 'Backpack',
  BIKE: 'Bike',
  CAR: 'Car',
  TRUCK: 'Van',
};
