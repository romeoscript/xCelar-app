import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BackpackIcon,
  BikeIcon,
  CarIcon,
  CheckCircleIcon,
  TruckIcon,
} from '@/components/icons';
import { RiderHeader } from '@/components/rider/rider-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { applyAsRider, VEHICLE_LABELS, type VehicleType } from '@/lib/rider-api';

const VEHICLES: { value: VehicleType; icon: typeof TruckIcon; hint: string }[] = [
  { value: 'BACKPACK', icon: BackpackIcon, hint: 'On foot' },
  { value: 'BIKE', icon: BikeIcon, hint: 'Fastest' },
  { value: 'CAR', icon: CarIcon, hint: 'Bigger loads' },
  { value: 'TRUCK', icon: TruckIcon, hint: 'Heavy items' },
];

export default function RiderOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const apply = useMutation({
    mutationFn: () => applyAsRider({ vehicleType: vehicleType as VehicleType, city: city.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-profile'] });
      router.replace('/rider/documents');
    },
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });

  const submit = () => {
    if (!vehicleType) {
      setError('Choose how you’ll deliver.');
      return;
    }
    if (!city.trim()) {
      setError('Enter the city you’ll ride in.');
      return;
    }
    setError(null);
    apply.mutate();
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <RiderHeader
        eyebrow="Become a rider"
        title="How will you deliver?"
        subtitle="Choose your vehicle and the city you’ll ride in."
        onBack={() => router.back()}
        step={1}
        totalSteps={2}
      />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {VEHICLES.map((vehicle) => {
            const active = vehicleType === vehicle.value;
            const Icon = vehicle.icon;
            return (
              <Pressable
                key={vehicle.value}
                onPress={() => setVehicleType(vehicle.value)}
                className={`h-28 w-[48%] justify-between rounded-2xl border-2 p-4 active:opacity-80 ${
                  active ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-xl ${
                      active ? 'bg-brand-blue' : 'bg-brand-surface'
                    }`}
                  >
                    <Icon size={22} color={active ? '#ffffff' : Brand.navy} />
                  </View>
                  {active ? <CheckCircleIcon size={20} color={Brand.blue} /> : null}
                </View>
                <View>
                  <Text className={`text-base font-bold ${active ? 'text-brand-blue' : 'text-brand-navy'}`}>
                    {VEHICLE_LABELS[vehicle.value]}
                  </Text>
                  <Text className="text-xs text-gray-400">{vehicle.hint}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <TextField
          label="City"
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Lagos"
          autoCapitalize="words"
        />

        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 12 }} className="border-t border-gray-100 px-6 pt-3">
        <Button label="Continue" loading={apply.isPending} onPress={submit} />
      </View>
    </View>
  );
}
