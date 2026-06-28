import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { getApiErrorMessage } from '@/lib/api-error';
import { applyAsRider, VEHICLE_LABELS, type VehicleType } from '@/lib/rider-api';

const VEHICLES: { value: VehicleType; emoji: string }[] = [
  { value: 'BACKPACK', emoji: '🎒' },
  { value: 'BIKE', emoji: '🏍️' },
  { value: 'CAR', emoji: '🚗' },
  { value: 'TRUCK', emoji: '🚚' },
];

export default function RiderOnboardingScreen() {
  const router = useRouter();
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
      setError('Pick your delivery vehicle.');
      return;
    }
    if (!city.trim()) {
      setError('Enter your city.');
      return;
    }
    setError(null);
    apply.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Become a rider" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text className="text-xl font-extrabold text-brand-navy">Let’s get you set up</Text>
          <Text className="text-sm text-gray-500">
            Tell us how you’ll deliver. You’ll upload your documents next.
          </Text>
        </View>

        <View className="gap-3">
          <Text className="text-sm font-semibold text-brand-navy">Delivery vehicle</Text>
          <View className="flex-row flex-wrap gap-3">
            {VEHICLES.map((vehicle) => {
              const active = vehicleType === vehicle.value;
              return (
                <Pressable
                  key={vehicle.value}
                  onPress={() => setVehicleType(vehicle.value)}
                  className={`h-24 w-[47%] items-center justify-center gap-1 rounded-2xl border active:opacity-80 ${
                    active ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text className="text-3xl">{vehicle.emoji}</Text>
                  <Text
                    className={`text-sm font-semibold ${active ? 'text-brand-blue' : 'text-gray-700'}`}
                  >
                    {VEHICLE_LABELS[vehicle.value]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <TextField
          label="City"
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Lagos"
          autoCapitalize="words"
        />

        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

        <Button label="Continue" loading={apply.isPending} onPress={submit} />
      </ScrollView>
    </SafeAreaView>
  );
}
