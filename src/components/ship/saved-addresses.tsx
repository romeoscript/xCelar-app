import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import {
  createSavedAddress,
  deleteSavedAddress,
  getSavedAddresses,
  type SavedAddress,
} from '@/lib/address-api';
import { tapFeedback } from '@/lib/haptics';

export type SavedAddressDraft = {
  contactName: string;
  contactPhone: string;
  address: string;
  lat: number | null;
  lng: number | null;
  zone: string;
};

export type SavedAddressesProps = {
  draft: SavedAddressDraft;
  onSelect: (entry: SavedAddress) => void;
};

export function SavedAddresses({ draft, onSelect }: SavedAddressesProps) {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);

  const savedQuery = useQuery({ queryKey: ['saved-addresses'], queryFn: getSavedAddresses });
  const saved = savedQuery.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });

  const saveMutation = useMutation({
    mutationFn: () =>
      createSavedAddress({
        contactName: draft.contactName.trim(),
        contactPhone: draft.contactPhone.trim(),
        address: draft.address.trim(),
        lat: draft.lat ?? undefined,
        lng: draft.lng ?? undefined,
        zone: draft.zone.trim() || undefined,
      }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSavedAddress(id),
    onSuccess: invalidate,
  });

  const alreadySaved = saved.some(
    (entry) =>
      entry.contactName === draft.contactName.trim() &&
      entry.contactPhone === draft.contactPhone.trim() &&
      entry.address === draft.address.trim(),
  );

  const canSave =
    !alreadySaved &&
    Boolean(draft.contactName.trim() && draft.contactPhone.trim() && draft.address.trim());

  return (
    <View className="flex-row gap-2">
      {saved.length > 0 ? (
        <Pressable
          onPress={() => {
            tapFeedback();
            setSheetOpen(true);
          }}
          className="flex-1 items-center rounded-2xl border border-brand-blue bg-brand-blue-tint py-3 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-brand-blue">
            Choose from saved ({saved.length})
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        disabled={!canSave || saveMutation.isPending}
        onPress={() => {
          tapFeedback();
          saveMutation.mutate();
        }}
        className={`flex-1 items-center rounded-2xl border border-gray-200 py-3 ${canSave ? 'active:opacity-70' : 'opacity-50'}`}
      >
        <Text className="text-sm font-semibold text-gray-700">
          {alreadySaved || saveMutation.isSuccess ? 'Saved ✓' : 'Save these details'}
        </Text>
      </Pressable>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text className="text-xl font-bold text-brand-navy">Saved addresses</Text>
        <ScrollView style={{ maxHeight: 360 }} className="mt-3">
          {saved.map((entry) => (
            <View key={entry.id} className="flex-row items-center gap-3 py-3">
              <Pressable
                onPress={() => {
                  onSelect(entry);
                  setSheetOpen(false);
                }}
                className="flex-1 active:opacity-70"
              >
                <Text className="text-base font-semibold text-gray-900">{entry.contactName}</Text>
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {entry.contactPhone} · {entry.address}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => deleteMutation.mutate(entry.id)}
                hitSlop={8}
                className="active:opacity-60"
              >
                <Text className="text-sm font-medium text-red-500">Remove</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
