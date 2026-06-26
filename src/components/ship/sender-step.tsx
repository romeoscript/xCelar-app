import { useQuery } from '@tanstack/react-query';
import { type ComponentType, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import {
  ChevronRightIcon,
  CrosshairIcon,
  type IconProps,
  PencilIcon,
  PinIcon,
} from '@/components/icons';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PhoneInput } from '@/components/ui/phone-input';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { getCurrentLocation, type PickedLocation } from '@/lib/location';
import { getZones } from '@/lib/zone-api';
import { MapPicker } from './map-picker';

export type SenderValues = {
  senderIsSelf: boolean | null;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderLat: number | null;
  senderLng: number | null;
  pickupZone: string;
};

export type SenderStepProps = {
  values: SenderValues;
  onChange: (partial: Partial<SenderValues>) => void;
  defaultName: string;
  defaultPhone: string;
};

export function SenderStep({ values, onChange, defaultName, defaultPhone }: SenderStepProps) {
  const [methodSheet, setMethodSheet] = useState(false);
  const [zoneSheet, setZoneSheet] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [zoneSearch, setZoneSearch] = useState('');

  const zonesQuery = useQuery({ queryKey: ['zones'], queryFn: getZones });
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const filteredZones = useMemo(() => {
    const term = zoneSearch.trim().toLowerCase();
    return term ? zones.filter((zone) => zone.name.toLowerCase().includes(term)) : zones;
  }, [zones, zoneSearch]);

  const hasChosenSender = values.senderIsSelf !== null;
  const hasAddress = values.senderAddress.trim().length > 0;

  const chooseSelf = () => {
    onChange({ senderIsSelf: true, senderName: defaultName, senderPhone: defaultPhone });
  };

  const chooseOther = () => {
    onChange({
      senderIsSelf: false,
      ...(values.senderIsSelf === true ? { senderName: '', senderPhone: '' } : {}),
    });
  };

  const applyLocation = (location: PickedLocation) => {
    setManualMode(false);
    setLocationError(null);
    onChange({
      senderAddress: location.address,
      senderLat: location.latitude,
      senderLng: location.longitude,
    });
  };

  const useManual = () => {
    setMethodSheet(false);
    setManualMode(true);
    onChange({ senderLat: null, senderLng: null });
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
    <View className="gap-6">
      <View className="gap-2">
        <Text className="text-base font-semibold text-brand-navy">Who is sending this package?</Text>
        <View className="flex-row gap-3">
          <ChoiceCard label="It's me" hint="Use my details" active={values.senderIsSelf === true} onPress={chooseSelf} />
          <ChoiceCard label="Someone else" hint="Enter details" active={values.senderIsSelf === false} onPress={chooseOther} />
        </View>
      </View>

      {hasChosenSender ? (
        <View className="gap-4">
          <TextField
            label="Sender's name"
            value={values.senderName}
            onChangeText={(value) => onChange({ senderName: value })}
            placeholder="Full name"
            autoCapitalize="words"
          />
          <PhoneInput
            label="Sender's phone"
            value={values.senderPhone}
            onChange={(value) => onChange({ senderPhone: value })}
          />

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Pickup address</Text>

            {locating ? (
              <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4">
                <ActivityIndicator color={Brand.blue} />
                <Text className="text-base text-gray-500">Detecting your location…</Text>
              </View>
            ) : manualMode ? (
              <View className="gap-2">
                <TextField
                  label=""
                  value={values.senderAddress}
                  onChangeText={(value) => onChange({ senderAddress: value })}
                  placeholder="Street, area, city"
                />
                <Pressable onPress={() => setMethodSheet(true)} className="active:opacity-70">
                  <Text className="text-sm font-medium text-brand-blue">Choose another method</Text>
                </Pressable>
              </View>
            ) : hasAddress ? (
              <View className="flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <PinIcon size={22} color={Brand.blue} />
                <Text className="flex-1 text-base text-gray-900">{values.senderAddress}</Text>
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
                <Text className="flex-1 text-base text-gray-500">Add pickup address</Text>
                <ChevronRightIcon size={20} color={Brand.muted} />
              </Pressable>
            )}

            {locationError ? <Text className="text-sm text-red-500">{locationError}</Text> : null}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Pickup zone</Text>
            <Pressable
              onPress={() => setZoneSheet(true)}
              className="h-14 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 active:opacity-70"
            >
              <Text className={values.pickupZone ? 'text-base text-gray-900' : 'text-base text-brand-muted'}>
                {values.pickupZone || 'Select pickup zone'}
              </Text>
              <Text className="text-xs text-gray-400">▾</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <BottomSheet visible={methodSheet} onClose={() => setMethodSheet(false)}>
        <Text className="text-xl font-bold text-brand-navy">Set pickup address</Text>
        <Text className="mt-1 text-sm text-gray-500">How would you like to provide it?</Text>
        <View className="mt-5 gap-2">
          <MethodRow icon={PencilIcon} title="Enter manually" hint="Type the address yourself" onPress={useManual} />
          <MethodRow icon={CrosshairIcon} title="Use current location" hint="Detect where you are now" onPress={useCurrentLocation} />
          <MethodRow icon={PinIcon} title="Set on map" hint="Drop a pin on the map" onPress={useMap} />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={zoneSheet}
        onClose={() => {
          setZoneSheet(false);
          setZoneSearch('');
        }}
      >
        <Text className="text-xl font-bold text-brand-navy">Pickup zone</Text>
        {zonesQuery.isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={Brand.blue} />
          </View>
        ) : zones.length > 0 ? (
          <>
            <TextInput
              value={zoneSearch}
              onChangeText={setZoneSearch}
              placeholder="Search area or state"
              placeholderTextColor={Brand.muted}
              autoCorrect={false}
              className="mt-3 h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
            />
            <FlatList
              data={filteredZones}
              keyExtractor={(zone) => zone.id}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 320 }}
              className="mt-2"
              renderItem={({ item }) => {
                const selected = item.name === values.pickupZone;
                return (
                  <Pressable
                    onPress={() => {
                      onChange({ pickupZone: item.name });
                      setZoneSheet(false);
                      setZoneSearch('');
                    }}
                    className="flex-row items-center justify-between py-3 active:opacity-60"
                  >
                    <Text
                      className={`text-base ${selected ? 'font-semibold text-brand-blue' : 'text-gray-800'}`}
                    >
                      {item.name}
                    </Text>
                    {selected ? <Text className="text-brand-blue">✓</Text> : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text className="py-8 text-center text-base text-gray-500">No matches.</Text>
              }
            />
          </>
        ) : (
          <Text className="py-8 text-center text-base text-gray-500">
            No pickup zones available right now.
          </Text>
        )}
      </BottomSheet>

      <MapPicker
        visible={mapOpen}
        initial={
          values.senderLat != null && values.senderLng != null
            ? { latitude: values.senderLat, longitude: values.senderLng }
            : null
        }
        onClose={() => setMapOpen(false)}
        onConfirm={(location) => {
          applyLocation(location);
          setMapOpen(false);
        }}
      />
    </View>
  );
}

function ChoiceCard({
  label,
  hint,
  active,
  onPress,
}: {
  label: string;
  hint: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className={`flex-1 rounded-2xl border p-4 active:opacity-80 ${
        active ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
      }`}
    >
      <Text className={`text-base font-semibold ${active ? 'text-brand-blue' : 'text-gray-900'}`}>
        {label}
      </Text>
      <Text className="mt-0.5 text-xs text-gray-500">{hint}</Text>
    </Pressable>
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
