import type { RiderJob, RiderLeg, Stop } from './rider-api';

/** How a job reads to the rider, by leg and stage. */
export type JobBadge = { label: string; pill: string; text: string };

const BLUE = { pill: 'bg-brand-blue-tint', text: 'text-brand-blue' };
const AMBER = { pill: 'bg-brand-gold-tint', text: 'text-amber-700' };
const GREEN = { pill: 'bg-green-50', text: 'text-green-700' };
const RED = { pill: 'bg-red-50', text: 'text-red-600' };
const GREY = { pill: 'bg-brand-surface', text: 'text-gray-600' };

export function jobBadge(job: RiderJob): JobBadge {
  if (job.isActive) {
    switch (job.stage) {
      case 'PICKUP_ASSIGNED':
        return { label: 'Pickup', ...BLUE };
      case 'PICKED_UP':
        return { label: 'To hub', ...AMBER };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Delivering', ...AMBER };
      case 'DELIVERY_FAILED':
        return { label: 'Back to hub', ...RED };
      case 'RETURNING_TO_SENDER':
        return { label: 'Returning', ...AMBER };
    }
  }
  if (job.leg === 'DELIVERY' && job.stage === 'DELIVERED') return { label: 'Delivered', ...GREEN };
  if (job.leg === 'RETURN' && job.stage === 'RETURNED_TO_SENDER') return { label: 'Returned', ...GREEN };
  return { label: job.leg === 'PICKUP' ? 'At hub' : 'Handed back', ...GREY };
}

/** Deliveries this rider completed — what earnings and "completed" count. */
export function isCompletedDelivery(job: RiderJob): boolean {
  return job.leg === 'DELIVERY' && job.stage === 'DELIVERED';
}

/** Where the rider should head next, or null once their part is done. */
export function nextStop(job: RiderJob): Stop | null {
  if (!job.isActive) return null;
  // Collecting from the sender, or bringing a failed delivery back to the hub.
  const headingBack = job.stage === 'PICKUP_ASSIGNED' || job.stage === 'DELIVERY_FAILED';
  return headingBack ? job.from : job.to;
}

const LEG_STEPS: Record<RiderLeg, string[]> = {
  PICKUP: ['Heading to pickup', 'At pickup', 'Taking it to the hub'],
  DELIVERY: ['Heading to drop-off', 'Proof of delivery'],
  RETURN: ['Heading to sender', 'Proof of return'],
};

/** Progress through the rider's current leg, or null when not active. */
export function legStep(job: RiderJob): { index: number; total: number; title: string } | null {
  if (!job.isActive) return null;
  const steps = LEG_STEPS[job.leg];
  if (job.stage === 'DELIVERY_FAILED') {
    return { index: steps.length - 1, total: steps.length, title: 'Bring it back to the hub' };
  }
  if (job.stage === 'PICKED_UP') {
    return { index: 2, total: steps.length, title: steps[2] };
  }
  const index = job.arrivedAt ? 1 : 0;
  return { index, total: steps.length, title: steps[index] };
}

/** Whether the rider can report a problem now: before collecting a pickup, or on a delivery. */
export function canReportProblem(job: RiderJob): boolean {
  return job.isActive && (job.stage === 'PICKUP_ASSIGNED' || job.stage === 'OUT_FOR_DELIVERY');
}
