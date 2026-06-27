import { type ShipmentStatus } from './shipment-api';

export type StatusMeta = {
  label: string;
  bg: string;
  text: string;
};

const META: Record<ShipmentStatus, StatusMeta> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600' },
  PENDING: { label: 'Awaiting pickup', bg: 'bg-amber-100', text: 'text-amber-700' },
  CONFIRMED: { label: 'Picked up', bg: 'bg-blue-100', text: 'text-blue-700' },
  IN_TRANSIT: { label: 'In transit', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  DELIVERED: { label: 'Delivered', bg: 'bg-green-100', text: 'text-green-700' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-600' },
};

export function statusMeta(status: ShipmentStatus): StatusMeta {
  return META[status] ?? META.PENDING;
}

/** Ordered delivery journey, for the progress timeline. */
export const DELIVERY_STAGES: { status: ShipmentStatus; label: string }[] = [
  { status: 'PENDING', label: 'Booked' },
  { status: 'CONFIRMED', label: 'Picked up' },
  { status: 'IN_TRANSIT', label: 'In transit' },
  { status: 'DELIVERED', label: 'Delivered' },
];
