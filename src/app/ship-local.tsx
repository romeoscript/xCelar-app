import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { ChipGroup } from '@/components/ship/chip-group';
import { SenderStep } from '@/components/ship/sender-step';
import { StepIndicator } from '@/components/ship/step-indicator';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { formatNaira } from '@/lib/format';
import {
  confirmShipment,
  getShipment,
  updateShipment,
  type Shipment,
  type ShipmentUpdate,
} from '@/lib/shipment-api';

type Form = {
  senderIsSelf: boolean | null;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderLat: number | null;
  senderLng: number | null;
  pickupZone: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  packageCategory: string;
  weightKg: string;
  declaredValue: string;
  description: string;
};

const EMPTY_FORM: Form = {
  senderIsSelf: null,
  senderName: '',
  senderPhone: '',
  senderAddress: '',
  senderLat: null,
  senderLng: null,
  pickupZone: '',
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  packageCategory: '',
  weightKg: '',
  declaredValue: '',
  description: '',
};

const CATEGORIES = ['Documents', 'Electronics', 'Clothing', 'Food', 'Furniture', 'Other'];
const STEP_TITLES = ['Sender details', 'Receiver details', 'Package details', 'Review & confirm'];
const TOTAL_STEPS = 4;

function formFromShipment(shipment: Shipment): Form {
  return {
    senderIsSelf: shipment.senderIsSelf,
    senderName: shipment.senderName ?? '',
    senderPhone: shipment.senderPhone ?? '',
    senderAddress: shipment.senderAddress ?? '',
    senderLat: shipment.senderLat,
    senderLng: shipment.senderLng,
    pickupZone: shipment.pickupZone ?? '',
    receiverName: shipment.receiverName ?? '',
    receiverPhone: shipment.receiverPhone ?? '',
    receiverAddress: shipment.receiverAddress ?? '',
    packageCategory: shipment.packageCategory ?? '',
    weightKg: shipment.weightKg != null ? String(shipment.weightKg) : '',
    declaredValue: shipment.declaredValue != null ? String(shipment.declaredValue) : '',
    description: shipment.description ?? '',
  };
}

function isStepValid(step: number, form: Form): boolean {
  if (step === 0) {
    return Boolean(
      form.senderIsSelf !== null &&
        form.senderName.trim() &&
        form.senderPhone.trim().length >= 7 &&
        form.senderAddress.trim() &&
        form.pickupZone.trim(),
    );
  }
  if (step === 1) {
    return Boolean(
      form.receiverName.trim() && form.receiverPhone.trim().length >= 7 && form.receiverAddress.trim(),
    );
  }
  if (step === 2) {
    return Boolean(
      form.packageCategory && Number(form.weightKg) > 0 && form.declaredValue.trim() !== '' && Number(form.declaredValue) >= 0,
    );
  }
  return true;
}

function patchForStep(step: number, form: Form): ShipmentUpdate {
  if (step === 0) {
    return {
      senderIsSelf: form.senderIsSelf ?? false,
      senderName: form.senderName.trim(),
      senderPhone: form.senderPhone.trim(),
      senderAddress: form.senderAddress.trim(),
      pickupZone: form.pickupZone.trim(),
      ...(form.senderLat != null && form.senderLng != null
        ? { senderLat: form.senderLat, senderLng: form.senderLng }
        : {}),
      currentStep: 1,
    };
  }
  if (step === 1) {
    return {
      receiverName: form.receiverName.trim(),
      receiverPhone: form.receiverPhone.trim(),
      receiverAddress: form.receiverAddress.trim(),
      currentStep: 2,
    };
  }
  return {
    packageCategory: form.packageCategory,
    weightKg: Number(form.weightKg),
    declaredValue: Number(form.declaredValue),
    description: form.description.trim() || undefined,
    currentStep: 3,
  };
}

export default function ShipLocalScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const { id } = useLocalSearchParams<{ id: string }>();

  const shipmentQuery = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => getShipment(id as string),
    enabled: Boolean(id),
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [price, setPrice] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<Shipment | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (shipmentQuery.data && !initialized.current) {
      initialized.current = true;
      setForm(formFromShipment(shipmentQuery.data));
      setStep(Math.min(Math.max(shipmentQuery.data.currentStep, 0), 3));
      setPrice(shipmentQuery.data.priceEstimate);
    }
  }, [shipmentQuery.data]);

  const saveStep = useMutation({
    mutationFn: (update: ShipmentUpdate) => updateShipment(id as string, update),
    onSuccess: (updated) => setPrice(updated.priceEstimate),
  });

  const confirm = useMutation({
    mutationFn: () => confirmShipment(id as string),
    onSuccess: (booked) => {
      setConfirmed(booked);
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });

  if (status !== 'authenticated') {
    return <Redirect href="/" />;
  }
  if (!id) {
    return <Redirect href="/home" />;
  }

  if (confirmed) {
    return <BookedView shipment={confirmed} onDone={() => router.replace('/home')} />;
  }

  if (shipmentQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={Brand.blue} />
      </SafeAreaView>
    );
  }

  const setField = (key: keyof Form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const patchForm = (partial: Partial<Form>) =>
    setForm((current) => ({ ...current, ...partial }));

  const handleBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep((current) => current - 1);
    }
  };

  const handleContinue = async () => {
    try {
      await saveStep.mutateAsync(patchForStep(step, form));
      setStep((current) => current + 1);
    } catch {
      // Surfaced via saveStep.isError below.
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="px-6 pt-2">
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
          >
            <ChevronLeftIcon size={22} color={Brand.navy} />
          </Pressable>

          <View className="mt-4 gap-3">
            <StepIndicator step={step} total={TOTAL_STEPS} />
            <View>
              <Text className="text-sm font-medium text-brand-blue">
                Step {step + 1} of {TOTAL_STEPS}
              </Text>
              <Text className="text-2xl font-extrabold text-brand-navy">{STEP_TITLES[step]}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? (
            <SenderStep
              values={form}
              onChange={patchForm}
              defaultName={user?.fullName ?? ''}
              defaultPhone={user?.phoneNumber ?? ''}
            />
          ) : null}

          {step === 1 ? (
            <>
              <TextField
                label="Full name"
                value={form.receiverName}
                onChangeText={setField('receiverName')}
                placeholder="Receiver's name"
                autoCapitalize="words"
              />
              <TextField
                label="Phone number"
                value={form.receiverPhone}
                onChangeText={setField('receiverPhone')}
                placeholder="0801 234 5678"
                keyboardType="phone-pad"
              />
              <TextField
                label="Delivery address"
                value={form.receiverAddress}
                onChangeText={setField('receiverAddress')}
                placeholder="Street, area, city"
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <View className="gap-2">
                <Text className="text-sm font-medium text-gray-700">Package category</Text>
                <ChipGroup
                  options={CATEGORIES}
                  value={form.packageCategory}
                  onChange={setField('packageCategory')}
                />
              </View>
              <TextField
                label="Weight (kg)"
                value={form.weightKg}
                onChangeText={setField('weightKg')}
                placeholder="e.g. 2.5"
                keyboardType="decimal-pad"
              />
              <TextField
                label="Declared value (₦)"
                value={form.declaredValue}
                onChangeText={setField('declaredValue')}
                placeholder="e.g. 50000"
                keyboardType="number-pad"
              />
              <TextField
                label="Description (optional)"
                value={form.description}
                onChangeText={setField('description')}
                placeholder="What's inside?"
              />
            </>
          ) : null}

          {step === 3 ? <ReviewSummary form={form} price={price} /> : null}

          {saveStep.isError || confirm.isError ? (
            <Text className="text-sm text-red-500">
              {getApiErrorMessage(saveStep.error ?? confirm.error)}
            </Text>
          ) : null}
        </ScrollView>

        <View className="px-6 pb-2">
          {step < 3 ? (
            <Button
              label="Continue"
              disabled={!isStepValid(step, form)}
              loading={saveStep.isPending}
              onPress={handleContinue}
            />
          ) : (
            <Button label="Confirm & book" loading={confirm.isPending} onPress={() => confirm.mutate()} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReviewSummary({ form, price }: { form: Form; price: number | null }) {
  return (
    <View className="gap-4">
      <SummaryCard
        title="Sender"
        lines={[
          form.senderName,
          form.senderPhone,
          form.senderAddress,
          form.pickupZone ? `Zone: ${form.pickupZone}` : '',
        ].filter(Boolean)}
      />
      <SummaryCard
        title="Receiver"
        lines={[form.receiverName, form.receiverPhone, form.receiverAddress]}
      />
      <SummaryCard
        title="Package"
        lines={[form.packageCategory, `${form.weightKg} kg`, form.description].filter(Boolean)}
      />
      <View className="flex-row items-center justify-between rounded-2xl bg-brand-blue-tint px-5 py-4">
        <Text className="text-base font-semibold text-brand-navy">Estimated total</Text>
        <Text className="text-xl font-extrabold text-brand-blue">
          {price != null ? formatNaira(price) : '—'}
        </Text>
      </View>
    </View>
  );
}

function SummaryCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-brand-surface p-4">
      <Text className="text-xs uppercase tracking-wider text-gray-500">{title}</Text>
      {lines.map((line, index) => (
        <Text
          key={index}
          className={`mt-1 ${index === 0 ? 'text-base font-semibold text-gray-900' : 'text-sm text-gray-600'}`}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

function BookedView({ shipment, onDone }: { shipment: Shipment; onDone: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center gap-3">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-blue-tint">
          <Text className="text-4xl">✅</Text>
        </View>
        <Text className="text-2xl font-extrabold text-brand-navy">Shipment booked!</Text>
        <Text className="text-center text-base text-gray-500">
          Your local delivery is created. Save your tracking code to follow it.
        </Text>
        <View className="mt-2 w-full rounded-2xl bg-brand-surface p-5">
          <Text className="text-xs uppercase tracking-wider text-gray-500">Tracking code</Text>
          <Text className="mt-1 text-xl font-bold text-brand-navy">{shipment.trackingCode}</Text>
          <View className="mt-4 flex-row justify-between border-t border-gray-200 pt-3">
            <Text className="text-sm text-gray-500">Amount</Text>
            <Text className="text-sm font-bold text-brand-navy">
              {shipment.priceEstimate != null ? formatNaira(shipment.priceEstimate) : '—'}
            </Text>
          </View>
        </View>
      </View>
      <View className="pb-6">
        <Button label="Back to home" onPress={onDone} />
      </View>
    </SafeAreaView>
  );
}
