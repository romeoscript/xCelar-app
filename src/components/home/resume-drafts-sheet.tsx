import { Pressable, ScrollView, Text, View } from 'react-native';

import { ChevronRightIcon, PackageIcon } from '@/components/icons';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { type Shipment, type ShipmentType } from '@/lib/shipment-api';

const TOTAL_STEPS = 4;

const LABEL: Record<ShipmentType, string> = {
  LOCAL: 'local',
  EXPORT: 'export',
  IMPORT: 'import',
};

function progress(currentStep: number): number {
  return Math.min(100, Math.max(0, Math.round((currentStep / TOTAL_STEPS) * 100)));
}

function summarize(draft: Shipment): string {
  if (draft.type === 'LOCAL') {
    return (
      [draft.pickupZone, draft.deliveryZone].filter(Boolean).join('  →  ') ||
      draft.receiverName ||
      'Local shipment'
    );
  }
  const country = draft.destinationCountryName;
  if (draft.type === 'EXPORT') {
    return country ? `To ${country}` : 'Export shipment';
  }
  return country ? `From ${country}` : 'Import shipment';
}

export type ResumeDraftsSheetProps = {
  drafts: Shipment[];
  busy: boolean;
  onResume: (draft: Shipment) => void;
  onDiscard: (draft: Shipment) => void;
  onStartNew: () => void;
  onClose: () => void;
};

/** Prompts the user to resume one of their in-progress drafts, discard one, or
 *  start a fresh shipment. Handles a single draft or several of the same type. */
export function ResumeDraftsSheet({
  drafts,
  busy,
  onResume,
  onDiscard,
  onStartNew,
  onClose,
}: ResumeDraftsSheetProps) {
  const first = drafts[0];
  const label = first ? LABEL[first.type] : '';
  const multiple = drafts.length > 1;

  return (
    <BottomSheet visible={drafts.length > 0} onClose={onClose}>
      <Text className="text-xl font-bold text-brand-navy">
        {multiple ? `${drafts.length} unfinished ${label} shipments` : 'Unfinished shipment'}
      </Text>
      <Text className="mt-1 text-base text-gray-500">
        {multiple
          ? 'Pick one to continue, or start a new shipment.'
          : `You have an unfinished ${label} shipment. Continue where you left off, or start a new one?`}
      </Text>

      <ScrollView style={{ maxHeight: 280 }} className="mt-4">
        {drafts.map((draft) => (
          <View
            key={draft.id}
            className="mb-2 flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3"
          >
            <Pressable
              onPress={() => onResume(draft)}
              className="flex-1 flex-row items-center gap-3 active:opacity-70"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-blue-tint">
                <PackageIcon size={20} color={Brand.blue} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                  {summarize(draft)}
                </Text>
                <Text className="text-xs text-gray-500">{progress(draft.currentStep)}% complete</Text>
              </View>
              <ChevronRightIcon size={18} color={Brand.muted} />
            </Pressable>
            <Pressable
              onPress={() => onDiscard(draft)}
              hitSlop={8}
              disabled={busy}
              className="active:opacity-60"
            >
              <Text className="text-sm font-medium text-red-500">Discard</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Button
        label="Start a new shipment"
        variant="secondary"
        loading={busy}
        onPress={onStartNew}
        className="mt-3"
      />
    </BottomSheet>
  );
}
