import { type ComponentType, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import {
  ChevronRightIcon,
  CrosshairIcon,
  type IconProps,
  PencilIcon,
  PinIcon,
} from '@/components/icons';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { getCurrentLocation, type PickedLocation } from '@/lib/location';
import { MapPicker } from './map-picker';

export type AddressValue = {
  address: string;
  lat: number | null;
  lng: number | null;
};

export type AddressFieldProps = {
  label: string;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
};

/** Address entry with three methods: manual, current location, or map pin. */
export function AddressField({ label, value, onChange }: AddressFieldProps) {
  const [methodSheet, setMethodSheet] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const hasAddress = value.address.trim().length > 0;

  const applyLocation = (location: PickedLocation) => {
    setManualMode(false);
    setLocationError(null);
    onChange({ address: location.address, lat: location.latitude, lng: location.longitude });
  };

  const useManual = () => {
    setMethodSheet(false);
    setManualMode(true);
    onChange({ ...value, lat: null, lng: null });
  };

  const useCurrentLocation = async () => {
    setMethodSheet(false);
    setLocating(true);
    setLocationError(null);
    try {
      applyLocation(await getCurrentLocation());
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Could not get your location.');
    } finally {
      setLocating(false);
    }
  };

  const useMap = () => {
    setMethodSheet(false);
    setMapOpen(true);
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gray-700">{label}</Text>

      {locating ? (
        <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4">
          <ActivityIndicator color={Brand.blue} />
          <Text className="text-base text-gray-500">Detecting your location…</Text>
        </View>
      ) : manualMode ? (
        <View className="gap-2">
          <TextField
            label=""
            value={value.address}
            onChangeText={(text) => onChange({ ...value, address: text })}
            placeholder="Street, area, city"
          />
          <Pressable onPress={() => setMethodSheet(true)} className="active:opacity-70">
            <Text className="text-sm font-medium text-brand-blue">Choose another method</Text>
          </Pressable>
        </View>
      ) : hasAddress ? (
        <View className="flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <PinIcon size={22} color={Brand.blue} />
          <Text className="flex-1 text-base text-gray-900">{value.address}</Text>
          <Pressable onPress={() => setMethodSheet(true)} hitSlop={8} className="active:opacity-70">
            <Text className="text-sm font-semibold text-brand-blue">Change</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setMethodSheet(true)}
          className="flex-row items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white p-4 active:opacity-70"
        >
          <PinIcon size={22} color={Brand.muted} />
          <Text className="flex-1 text-base text-gray-500">Add address</Text>
          <ChevronRightIcon size={20} color={Brand.muted} />
        </Pressable>
      )}

      {locationError ? <Text className="text-sm text-red-500">{locationError}</Text> : null}

      <BottomSheet visible={methodSheet} onClose={() => setMethodSheet(false)}>
        <Text className="text-xl font-bold text-brand-navy">Set address</Text>
        <Text className="mt-1 text-sm text-gray-500">How would you like to provide it?</Text>
        <View className="mt-5 gap-2">
          <MethodRow icon={PencilIcon} title="Enter manually" hint="Type the address yourself" onPress={useManual} />
          <MethodRow icon={CrosshairIcon} title="Use current location" hint="Detect where you are now" onPress={useCurrentLocation} />
          <MethodRow icon={PinIcon} title="Set on map" hint="Drop a pin on the map" onPress={useMap} />
        </View>
      </BottomSheet>

      <MapPicker
        visible={mapOpen}
        initial={value.lat != null && value.lng != null ? { latitude: value.lat, longitude: value.lng } : null}
        onClose={() => setMapOpen(false)}
        onConfirm={(location) => {
          applyLocation(location);
          setMapOpen(false);
        }}
      />
    </View>
  );
}

function MethodRow({
  icon: Icon,
  title,
  hint,
  onPress,
}: {
  icon: ComponentType<IconProps>;
  title: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className="flex-row items-center gap-3 rounded-2xl bg-brand-surface p-4 active:opacity-70"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
        <Icon size={20} color={Brand.blue} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        <Text className="text-sm text-gray-500">{hint}</Text>
      </View>
      <ChevronRightIcon size={20} color={Brand.muted} />
    </Pressable>
  );
}
