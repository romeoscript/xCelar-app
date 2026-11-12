import { useQueryClient } from '@tanstack/react-query';

import { useRealtime } from '@/lib/realtime';

/** Refreshes a customer's shipments and tracking the moment their status changes. */
export function CustomerLiveUpdates() {
  const queryClient = useQueryClient();

  useRealtime(true, (event) => {
    if (event.type !== 'shipment.changed') return;
    void queryClient.invalidateQueries({ queryKey: ['shipments'] });
    void queryClient.invalidateQueries({ queryKey: ['shipment', event.shipmentId] });
    void queryClient.invalidateQueries({ queryKey: ['shipment-tracking', event.shipmentId] });
  });

  return null;
}
