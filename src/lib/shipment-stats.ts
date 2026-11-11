import { type Shipment } from '@/lib/shipment-api';

const DAY_MS = 24 * 60 * 60 * 1000;

export type WeekStats = {
  /** Shipments booked on each day this week, Monday first. */
  perDay: number[];
  sent: number;
  sentLastWeek: number;
  delivered: number;
  inProgress: number;
  /** Total booked price this week, in kobo (summed as integers to avoid float drift). */
  spentKobo: number;
  /** Monday 00:00 local time, for the "12–18 Nov" label. */
  weekStart: Date;
};

function startOfWeek(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  // getDay(): Sunday 0 … Saturday 6; weeks here start on Monday.
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

/** When a shipment was booked: when it was paid, else when it was created. */
function bookedAt(shipment: Shipment): Date {
  return new Date(shipment.paidAt ?? shipment.createdAt);
}

/** This week's numbers from the customer's booked shipments. */
export function weekStats(shipments: Shipment[], now = new Date()): WeekStats {
  const weekStart = startOfWeek(now);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * DAY_MS);
  const perDay = [0, 0, 0, 0, 0, 0, 0];
  let sentLastWeek = 0;
  let spentKobo = 0;

  for (const shipment of shipments) {
    const at = bookedAt(shipment);
    if (at >= weekStart) {
      perDay[Math.min(6, Math.floor((at.getTime() - weekStart.getTime()) / DAY_MS))] += 1;
      spentKobo += Math.round((shipment.priceEstimate ?? 0) * 100);
    } else if (at >= lastWeekStart) {
      sentLastWeek += 1;
    }
  }

  const delivered = shipments.filter((shipment) => shipment.status === 'DELIVERED').length;
  const finished = shipments.filter((shipment) => shipment.status === 'DELIVERED' || shipment.status === 'CANCELLED').length;

  return {
    perDay,
    sent: perDay.reduce((sum, count) => sum + count, 0),
    sentLastWeek,
    delivered,
    inProgress: shipments.length - finished,
    spentKobo,
    weekStart,
  };
}

/** Straight-line distance between two points, in kilometres. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
