import { useQuery } from '@tanstack/react-query';

import { getShipment, getShipmentTracking, type Shipment } from '@/lib/shipment-api';

/** Only a local delivery that's actually moving has a rider to track. */
export function isTrackable(shipment?: Shipment): boolean {
  return (
    shipment?.type === 'LOCAL' &&
    (shipment.status === 'CONFIRMED' || shipment.status === 'IN_TRANSIT')
  );
}

/**
 * A shipment plus its live rider tracking, polled every 10s while trackable.
 * The detail screen and the full-screen map share these caches, so opening the
 * map shows the latest position immediately instead of a loading state.
 */
export function useShipmentTracking(id: string | undefined) {
  const shipmentQuery = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => getShipment(id as string),
    enabled: Boolean(id),
  });
  const trackable = isTrackable(shipmentQuery.data);
  const trackingQuery = useQuery({
    queryKey: ['shipment-tracking', id],
    queryFn: () => getShipmentTracking(id as string),
    enabled: Boolean(id) && trackable,
    refetchInterval: 10_000,
  });
  return { shipmentQuery, trackingQuery, trackable };
}
