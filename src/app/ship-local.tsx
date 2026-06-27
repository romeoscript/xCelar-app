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
import { ReceiverStep } from '@/components/ship/receiver-step';
import { SenderStep } from '@/components/ship/sender-step';
import { StepIndicator } from '@/components/ship/step-indicator';
import { Button } from '@/components/ui/button';
import { PaymentOptions, type PaymentMethod } from '@/components/ship/payment-options';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { runPaystackCheckout } from '@/lib/checkout';
import { formatNaira } from '@/lib/format';
import { successFeedback } from '@/lib/haptics';
import {
  getShipment,
  initPaystackForShipment,
  payWithBalance,
  updateShipment,
  type Shipment,
  type ShipmentUpdate,
} from '@/lib/shipment-api';
import { getWalletBalance } from '@/lib/wallet-api';

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
  receiverLat: number | null;
  receiverLng: number | null;
  deliveryZone: string;
  packageCategory: string;
  weightKg: string;
  declaredValue: string;
  description: string;
  fragile: boolean;
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
  receiverLat: null,
  receiverLng: null,
  deliveryZone: '',
  packageCategory: '',
  weightKg: '',
  declaredValue: '',
  description: '',
  fragile: false,
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
    receiverLat: shipment.receiverLat,
    receiverLng: shipment.receiverLng,
    deliveryZone: shipment.deliveryZone ?? '',
    packageCategory: shipment.packageCategory ?? '',
    weightKg: shipment.weightKg != null ? String(shipment.weightKg) : '',
    declaredValue: shipment.declaredValue != null ? String(shipment.declaredValue) : '',
    description: shipment.description ?? '',
    fragile: shipment.fragile,
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
      form.receiverName.trim() &&
        form.receiverPhone.trim().length >= 7 &&
        form.receiverAddress.trim() &&
        form.deliveryZone.trim(),
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
      deliveryZone: form.deliveryZone.trim(),
      ...(form.receiverLat != null && form.receiverLng != null
        ? { receiverLat: form.receiverLat, receiverLng: form.receiverLng }
        : {}),
      currentStep: 2,
    };
  }
  return {
    packageCategory: form.packageCategory,
    weightKg: Number(form.weightKg),
    declaredValue: Number(form.declaredValue),
    description: form.description.trim() || undefined,
    fragile: form.fragile,
    currentStep: 3,
  };
}

export default function ShipLocalScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('balance');
  const [termsAccepted, setTermsAccepted] = useState(false);
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

  const pay = useMutation({
    mutationFn: async (): Promise<Shipment> => {
      if (paymentMethod === 'balance') {
        return payWithBalance(id as string, termsAccepted);
      }
      const init = await initPaystackForShipment(id as string, termsAccepted);
      const result = await runPaystackCheckout(init.authorizationUrl, init.reference);
      if (!result.success) {
        throw new Error('Payment was not completed. If you were charged, it will reflect shortly.');
      }
      return getShipment(id as string);
    },
    onSuccess: async (booked) => {
      successFeedback();
      try {
        updateUser({ balanceKobo: await getWalletBalance() });
      } catch {
        // Non-fatal: balance will refresh on next load.
      }
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

          {step === 1 ? <ReceiverStep values={form} onChange={patchForm} /> : null}

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
              <Pressable
                onPress={() => patchForm({ fragile: !form.fragile })}
                className="flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 active:opacity-80"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-base font-semibold text-gray-900">Fragile item</Text>
                  <Text className="text-sm text-gray-500">Handle with extra care</Text>
                </View>
                <View
                  className={`h-7 w-12 justify-center rounded-full px-0.5 ${form.fragile ? 'bg-brand-blue' : 'bg-gray-300'}`}
                >
                  <View
                    className={`h-6 w-6 rounded-full bg-white ${form.fragile ? 'self-end' : 'self-start'}`}
                  />
                </View>
              </Pressable>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <ReviewSummary form={form} price={price} />
              <PaymentOptions
                price={price}
                balanceKobo={user?.balanceKobo ?? 0}
                method={paymentMethod}
                onMethodChange={setPaymentMethod}
                termsAccepted={termsAccepted}
                onTermsChange={setTermsAccepted}
                onOpenTerms={() => router.push('/terms')}
              />
            </>
          ) : null}

          {saveStep.isError || pay.isError ? (
            <Text className="text-sm text-red-500">
              {getApiErrorMessage(saveStep.error ?? pay.error)}
            </Text>
          ) : null}
        </ScrollView>

        <View className="gap-2 px-6 pb-2">
          {step < 3 ? (
            <Button
              label="Continue"
              disabled={!isStepValid(step, form)}
              loading={saveStep.isPending}
              onPress={handleContinue}
            />
          ) : (
            <>
              <Button
                label={price != null ? `Pay ${formatNaira(price)}` : 'Pay'}
                disabled={!termsAccepted}
                loading={pay.isPending}
                onPress={() => pay.mutate()}
              />
              <Pressable
                onPress={() => router.back()}
                className="items-center py-2 active:opacity-70"
              >
                <Text className="text-sm font-medium text-gray-500">Save as draft</Text>
              </Pressable>
            </>
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
        lines={[
          form.receiverName,
          form.receiverPhone,
          form.receiverAddress,
          form.deliveryZone ? `Zone: ${form.deliveryZone}` : '',
        ].filter(Boolean)}
      />
      <SummaryCard
        title="Package"
        lines={[
          form.packageCategory,
          `${form.weightKg} kg`,
          form.fragile ? 'Fragile' : '',
          form.description,
        ].filter(Boolean)}
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
