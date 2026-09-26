import { type Shipment, type ShipmentStatus, type ShipmentTracking } from './shipment-api';

export type StatusMeta = {
  label: string;
  bg: string;
  text: string;
};

const META: Record<ShipmentStatus, StatusMeta> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600' },
  PENDING: { label: 'Awaiting pickup', bg: 'bg-amber-100', text: 'text-amber-700' },
  // A rider has accepted the job but hasn't collected the package yet.
  CONFIRMED: { label: 'Rider assigned', bg: 'bg-blue-100', text: 'text-blue-700' },
  IN_TRANSIT: { label: 'In transit', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  DELIVERED: { label: 'Delivered', bg: 'bg-green-100', text: 'text-green-700' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-600' },
};

export function statusMeta(status: ShipmentStatus): StatusMeta {
  return META[status] ?? META.PENDING;
}

const AWAITING_PAYMENT: StatusMeta = {
  label: 'Awaiting payment',
  bg: 'bg-amber-100',
  text: 'text-amber-700',
};

/** Status to show for a shipment, accounting for unpaid drafts. */
export function shipmentStatusMeta(shipment: Pick<Shipment, 'status' | 'paid'>): StatusMeta {
  if (!shipment.paid && shipment.status === 'DRAFT') {
    return AWAITING_PAYMENT;
  }
  return statusMeta(shipment.status);
}

export type DeliveryStage = {
  status: ShipmentStatus;
  label: string;
  /** When the shipment reached this stage, if known. */
  at: (shipment: Shipment) => string | null | undefined;
};

/** Ordered delivery journey, for the progress timeline. */
export const DELIVERY_STAGES: DeliveryStage[] = [
  { status: 'PENDING', label: 'Booked', at: (s) => s.paidAt ?? s.createdAt },
  { status: 'CONFIRMED', label: 'Rider assigned', at: (s) => s.acceptedAt },
  { status: 'IN_TRANSIT', label: 'Picked up', at: (s) => s.pickedUpAt },
  { status: 'DELIVERED', label: 'Delivered', at: (s) => s.deliveredAt },
];

/** Compact relative time for the rider's last location update, e.g. "12s ago". */
export function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  return `${Math.round(minutes / 60)}h ago`;
}

/** Human-readable rider status, including the "arrived" sub-states. */
export function trackingStatusText(status: ShipmentStatus, tracking?: ShipmentTracking): string {
  if (status === 'IN_TRANSIT') {
    return tracking?.arrivedDropoff
      ? 'Your rider has arrived and is handing over your package.'
      : 'Your rider has the package and is on the way to the drop-off.';
  }
  return tracking?.arrivedPickup
    ? 'Your rider has arrived at the pickup point.'
    : 'Your rider is on the way to collect the package.';
}
