import { type DeliveryStage, type Shipment, type ShipmentStatus, type ShipmentTracking } from './shipment-api';

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

/** Booked = confirmed by paying or choosing pay-on-delivery. Anything still a
 *  draft is awaiting payment; a pay-on-delivery booking is booked but unpaid. */
export function isBooked(shipment: Pick<Shipment, 'status'>): boolean {
  return shipment.status !== 'DRAFT';
}

const STAGE_META: Record<DeliveryStage, StatusMeta> = {
  AWAITING_PICKUP: META.PENDING,
  PICKUP_ASSIGNED: META.CONFIRMED,
  PICKED_UP: { label: 'On the way to hub', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  AT_HUB: { label: 'At Xcelar hub', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  REJECTED_AT_HUB: { label: 'Not accepted', bg: 'bg-red-100', text: 'text-red-600' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  DELIVERY_FAILED: { label: 'Delivery attempt failed', bg: 'bg-amber-100', text: 'text-amber-700' },
  DELIVERED: META.DELIVERED,
  RETURNING_TO_SENDER: { label: 'Returning to sender', bg: 'bg-amber-100', text: 'text-amber-700' },
  RETURNED_TO_SENDER: { label: 'Returned to sender', bg: 'bg-gray-100', text: 'text-gray-600' },
};

/** Status to show for a shipment: its hub stage when booked locally, accounting for unpaid drafts. */
export function shipmentStatusMeta(shipment: Pick<Shipment, 'status' | 'paid' | 'stage'>): StatusMeta {
  if (shipment.stage) {
    return STAGE_META[shipment.stage];
  }
  if (!shipment.paid && shipment.status === 'DRAFT') {
    return AWAITING_PAYMENT;
  }
  return statusMeta(shipment.status);
}

export type JourneyStep = {
  key: string;
  label: string;
  /** When the step was reached, if it has been. */
  at: string | null;
  state: 'done' | 'current' | 'todo';
};

export type Journey = {
  steps: JourneyStep[];
  /** Explains a detour off the happy path (failed attempt, rejection, return). */
  notice: string | null;
};

/** Same-town deliveries skip the hub: one rider collects and delivers. */
const DIRECT_JOURNEY: { stage: DeliveryStage; label: string }[] = [
  { stage: 'AWAITING_PICKUP', label: 'Booked' },
  { stage: 'PICKUP_ASSIGNED', label: 'Rider assigned' },
  { stage: 'OUT_FOR_DELIVERY', label: 'Picked up, on the way' },
  { stage: 'DELIVERED', label: 'Delivered' },
];

const HUB_JOURNEY: { stage: DeliveryStage; label: string }[] = [
  { stage: 'AWAITING_PICKUP', label: 'Booked' },
  { stage: 'PICKED_UP', label: 'Picked up' },
  { stage: 'AT_HUB', label: 'At Xcelar hub' },
  { stage: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { stage: 'DELIVERED', label: 'Delivered' },
];

const STAGE_NOTICES: Partial<Record<DeliveryStage, string>> = {
  DELIVERY_FAILED: 'We couldn’t complete the delivery. The package is going back to our hub and we’ll try again or be in touch.',
  REJECTED_AT_HUB: 'We couldn’t accept this package at our hub. It will be returned to the sender.',
  RETURNING_TO_SENDER: 'This package is on its way back to the sender.',
  RETURNED_TO_SENDER: 'This package was returned to the sender.',
};

/** The single-rider journey older shipments and EXPORT/IMPORT still show. */
const STATUS_JOURNEY: { status: ShipmentStatus; label: string; at: (s: Shipment) => string | null | undefined }[] = [
  { status: 'PENDING', label: 'Booked', at: (s) => s.paidAt ?? s.createdAt },
  { status: 'CONFIRMED', label: 'Rider assigned', at: (s) => s.acceptedAt },
  { status: 'IN_TRANSIT', label: 'Picked up', at: (s) => s.pickedUpAt },
  { status: 'DELIVERED', label: 'Delivered', at: (s) => s.deliveredAt },
];

/** Ordered progress for the timeline card. */
export function journeyFor(shipment: Shipment): Journey {
  if (shipment.stage && shipment.timeline) {
    // A failed direct delivery is re-routed via the hub, so `route` already says HUB.
    const steps = shipment.route === 'DIRECT' ? DIRECT_JOURNEY : HUB_JOURNEY;
    return stageJourney(steps, shipment.stage, shipment.timeline);
  }
  const currentIndex = STATUS_JOURNEY.findIndex((step) => step.status === shipment.status);
  const finished = shipment.status === 'DELIVERED';
  return {
    notice: null,
    steps: STATUS_JOURNEY.map((step, index) => {
      const state = finished || index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
      return { key: step.status, label: step.label, at: state === 'todo' ? null : (step.at(shipment) ?? null), state };
    }),
  };
}

function stageJourney(
  journey: { stage: DeliveryStage; label: string }[],
  stage: DeliveryStage,
  timeline: { stage: DeliveryStage; at: string }[],
): Journey {
  // Latest time each stage was reached; a re-delivery reaches AT_HUB twice.
  const reachedAt = new Map(timeline.map((event) => [event.stage, event.at]));
  const reached = journey.map((step) => reachedAt.has(step.stage));
  const lastReached = reached.lastIndexOf(true);
  const finished = stage === 'DELIVERED';
  return {
    notice: STAGE_NOTICES[stage] ?? null,
    steps: journey.map((step, index) => {
      const state = finished || index < lastReached ? 'done' : index === lastReached ? 'current' : 'todo';
      return { key: step.stage, label: step.label, at: reachedAt.get(step.stage) ?? null, state };
    }),
  };
}

type TrackingSubject = Pick<Shipment, 'status' | 'stage'>;

/** Which stop the rider is heading to, for the live map. */
export function headingTo(shipment: TrackingSubject): 'pickup' | 'dropoff' {
  if (shipment.stage) {
    return shipment.stage === 'OUT_FOR_DELIVERY' ? 'dropoff' : 'pickup';
  }
  return shipment.status === 'IN_TRANSIT' ? 'dropoff' : 'pickup';
}

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

const STAGE_TRACKING_TEXT: Partial<Record<DeliveryStage, string>> = {
  PICKED_UP: 'Your package is on its way to the Xcelar hub.',
  AT_HUB: 'Your package is at the Xcelar hub, waiting to go out for delivery.',
  DELIVERY_FAILED: 'The delivery attempt failed. Your package is going back to the hub.',
  RETURNING_TO_SENDER: 'Your package is on its way back to the sender.',
};

/** Human-readable rider status, including the "arrived" sub-states. */
export function trackingStatusText(shipment: TrackingSubject, tracking?: ShipmentTracking): string {
  const stageText = shipment.stage ? STAGE_TRACKING_TEXT[shipment.stage] : undefined;
  if (stageText) {
    return stageText;
  }
  if (headingTo(shipment) === 'dropoff') {
    return tracking?.arrivedDropoff
      ? 'Your rider has arrived and is handing over your package.'
      : 'Your rider has the package and is on the way to the drop-off.';
  }
  return tracking?.arrivedPickup
    ? 'Your rider has arrived at the pickup point.'
    : 'Your rider is on the way to collect the package.';
}

/** A zone's area without the state, e.g. "Eti Osa, Lagos" -> "Eti Osa". */
export function areaName(zone: string | null | undefined): string | null {
  return zone ? zone.split(',')[0].trim() : null;
}

const FINISHED_STAGES: DeliveryStage[] = ['DELIVERED', 'RETURNED_TO_SENDER'];

/** Booked and not yet finished: delivered, returned or cancelled. */
export function isInProgress(shipment: Pick<Shipment, 'status' | 'stage'>): boolean {
  if (shipment.status === 'DELIVERED' || shipment.status === 'CANCELLED' || shipment.status === 'DRAFT') return false;
  return !(shipment.stage && FINISHED_STAGES.includes(shipment.stage));
}
