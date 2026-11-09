import { useQuery } from '@tanstack/react-query';

import { getShipment, getShipmentTracking, type DeliveryStage, type Shipment } from '@/lib/shipment-api';

/** Hub stages where a rider is out with (or on the way to) the customer's package. */
const RIDER_OUT_STAGES: DeliveryStage[] = ['PICKUP_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];

/** Only a local delivery with a rider out on it has someone to track. */
export function isTrackable(shipment?: Shipment): boolean {
  if (shipment?.type !== 'LOCAL') {
    return false;
  }
  if (shipment.stage) {
    return RIDER_OUT_STAGES.includes(shipment.stage);
  }
  return shipment.status === 'CONFIRMED' || shipment.status === 'IN_TRANSIT';
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
