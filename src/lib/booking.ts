import { createDraft, getOpenDraft, type ShipmentType } from '@/lib/shipment-api';

/** Each shipment type is booked in its own flow. */
export const BOOKING_ROUTE: Record<ShipmentType, '/ship-local' | '/ship-export' | '/ship-import'> = {
  LOCAL: '/ship-local',
  EXPORT: '/ship-export',
  IMPORT: '/ship-import',
};

/** An untouched draft to book into: the open one if nothing's been filled in yet, else a new one. */
export async function freshDraftId(type: ShipmentType): Promise<string> {
  const existing = await getOpenDraft(type);
  const draft = existing && existing.currentStep === 0 ? existing : await createDraft(type);
  return draft.id;
}
