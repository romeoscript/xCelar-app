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

/** Deliveries this rider completed — what the "delivered" counts use. */
export function isCompletedDelivery(job: RiderJob): boolean {
  return job.leg === 'DELIVERY' && job.stage === 'DELIVERED';
}

/** Where the rider should head next, or null once their part is done. */
export function nextStop(job: RiderJob): Stop | null {
  if (!job.isActive) return null;
  if (job.stage === 'PICKUP_ASSIGNED') return job.from;
  if (job.stage === 'DELIVERY_FAILED') return job.hub;
  return job.to;
}

const LEG_STEPS: Record<RiderLeg, string[]> = {
  PICKUP: ['Heading to pickup', 'At pickup', 'Taking it to the hub'],
  DELIVERY: ['Heading to drop-off', 'Proof of delivery'],
  RETURN: ['Heading to sender', 'Proof of return'],
};

/** A direct job is one rider's whole trip, shown as a single run of steps. */
const DIRECT_STEPS = ['Heading to pickup', 'At pickup', 'Heading to drop-off', 'Proof of delivery'];

/** Progress through the rider's current job, or null when not active. */
export function legStep(job: RiderJob): { index: number; total: number; title: string } | null {
  if (!job.isActive) return null;
  if (job.route === 'DIRECT' && job.stage !== 'DELIVERY_FAILED') {
    const offset = job.stage === 'OUT_FOR_DELIVERY' ? 2 : 0;
    const index = offset + (job.arrivedAt ? 1 : 0);
    return { index, total: DIRECT_STEPS.length, title: DIRECT_STEPS[index] };
  }
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
