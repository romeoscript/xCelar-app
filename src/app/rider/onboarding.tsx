import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ComponentProps, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckCircleIcon } from '@/components/icons';
import { RiderHeader } from '@/components/rider/rider-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  applyAsRider,
  VEHICLE_LABELS,
  type VehicleOwnership,
  type VehicleType,
} from '@/lib/rider-api';

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const VEHICLES: { value: VehicleType; icon: MciName; hint: string }[] = [
  { value: 'BACKPACK', icon: 'bag-personal', hint: 'On foot' },
  { value: 'BIKE', icon: 'motorbike', hint: 'Fastest' },
  { value: 'CAR', icon: 'car', hint: 'Bigger loads' },
  { value: 'TRUCK', icon: 'truck', hint: 'Heavy items' },
];

const OWNERSHIP: { value: VehicleOwnership; icon: MciName; title: string; subtitle: string }[] = [
  { value: 'PERSONAL', icon: 'account', title: 'Personal vehicle', subtitle: 'I own the vehicle I’ll ride.' },
  {
    value: 'COMPANY',
    icon: 'office-building',
    title: 'Company vehicle',
    subtitle: 'Provided by a company or fleet.',
  },
];

const STEP_COPY = [
  { title: 'How will you deliver?', subtitle: 'Pick the vehicle you’ll use most.' },
  { title: 'Whose vehicle is it?', subtitle: 'Tell us who the vehicle belongs to.' },
  { title: 'Where do you ride?', subtitle: 'The city you’ll pick up deliveries in.' },
];

export default function RiderOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [ownership, setOwnership] = useState<VehicleOwnership | null>(null);
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const apply = useMutation({
    mutationFn: () =>
      applyAsRider({
        vehicleType: vehicleType as VehicleType,
        vehicleOwnership: ownership as VehicleOwnership,
        city: city.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-profile'] });
      router.replace('/rider/documents');
    },
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });

  const goBack = () => {
    if (step > 1) {
      setError(null);
      setStep(step - 1);
      return;
    }
    router.back();
  };

  const goNext = () => {
    if (step === 1 && !vehicleType) {
      setError('Choose how you’ll deliver.');
      return;
    }
    if (step === 2 && !ownership) {
      setError('Pick the vehicle ownership.');
      return;
    }
    if (step === 3 && !city.trim()) {
      setError('Enter the city you’ll ride in.');
      return;
    }
    setError(null);
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    apply.mutate();
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <RiderHeader
        eyebrow="Become a rider"
        title={STEP_COPY[step - 1].title}
        subtitle={STEP_COPY[step - 1].subtitle}
        onBack={goBack}
        step={step}
        totalSteps={4}
      />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {VEHICLES.map((vehicle) => {
              const active = vehicleType === vehicle.value;
              return (
                <Pressable
                  key={vehicle.value}
                  onPress={() => setVehicleType(vehicle.value)}
                  className={`h-32 w-[48%] justify-between rounded-2xl border-2 p-4 active:opacity-80 ${
                    active ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
                  }`}
                >
                  <View className="flex-row items-start justify-between">
                    <MaterialCommunityIcons
                      name={vehicle.icon}
                      size={40}
                      color={active ? Brand.blue : Brand.navy}
                    />
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
        ) : null}

        {step === 2 ? (
          <View className="gap-3">
            {OWNERSHIP.map((option) => {
              const active = ownership === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setOwnership(option.value)}
                  className={`flex-row items-center gap-3 rounded-2xl border-2 p-4 active:opacity-80 ${
                    active ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
                  }`}
                >
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-xl ${
                      active ? 'bg-brand-blue' : 'bg-brand-surface'
                    }`}
                  >
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={24}
                      color={active ? '#ffffff' : Brand.navy}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-brand-navy">{option.title}</Text>
                    <Text className="text-sm text-gray-500">{option.subtitle}</Text>
                  </View>
                  {active ? (
                    <CheckCircleIcon size={22} color={Brand.blue} />
                  ) : (
                    <View className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 3 ? (
          <TextField
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Lagos"
            autoCapitalize="words"
          />
        ) : null}

        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 12 }} className="border-t border-gray-100 px-6 pt-3">
        <Button label="Continue" loading={apply.isPending} onPress={goNext} />
      </View>
    </View>
  );
}
