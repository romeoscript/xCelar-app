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
import { ReceiverStep } from '@/components/ship/receiver-step';
import { SenderStep } from '@/components/ship/sender-step';
import { StepIndicator } from '@/components/ship/step-indicator';
import { Button } from '@/components/ui/button';
import { PaystackCheckout } from '@/components/paystack-checkout';
import { PaymentOptions, type PaymentMethod } from '@/components/ship/payment-options';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { ITEM_CATEGORY_OPTIONS } from '@/constants/categories';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { formatNaira } from '@/lib/format';
import { successFeedback } from '@/lib/haptics';
import { toast } from '@/lib/toast-store';
import {
  getShipment,
  initPaystackForShipment,
  payWithBalance,
  updateShipment,
  type Shipment,
  type ShipmentUpdate,
} from '@/lib/shipment-api';
import { getWalletBalance, type VerifyResult } from '@/lib/wallet-api';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

type Form = {
  senderIsSelf: boolean | null;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderLat: number | null;
  senderLng: number | null;
  pickupZone: string;
  pickupDate: Date | null;
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
  pickupDate: null,
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
    pickupDate: shipment.pickupDate ? new Date(shipment.pickupDate) : null,
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

export type FormErrors = Partial<Record<keyof Form, string>>;

function validateStep(step: number, form: Form): FormErrors {
  const errors: FormErrors = {};
  if (step === 0) {
    if (form.senderIsSelf === null) errors.senderIsSelf = 'Choose who is sending this package';
    if (!form.senderName.trim()) errors.senderName = "Enter the sender's name";
    if (form.senderPhone.trim().length < 7) errors.senderPhone = 'Enter a valid phone number';
    if (!form.senderAddress.trim()) errors.senderAddress = 'Add the pickup address';
    if (!form.pickupZone.trim()) errors.pickupZone = 'Select a pickup zone';
    if (form.pickupDate === null) errors.pickupDate = 'Select a pickup date';
  }
  if (step === 1) {
    if (!form.receiverName.trim()) errors.receiverName = "Enter the receiver's name";
    if (form.receiverPhone.trim().length < 7) errors.receiverPhone = 'Enter a valid phone number';
    if (!form.receiverAddress.trim()) errors.receiverAddress = 'Add the delivery address';
    if (!form.deliveryZone.trim()) errors.deliveryZone = 'Select a delivery zone';
  }
  if (step === 2) {
    if (!form.packageCategory) errors.packageCategory = 'Select a package category';
    if (!(Number(form.weightKg) > 0)) errors.weightKg = 'Enter the weight in kg';
    if (form.declaredValue.trim() === '' || !(Number(form.declaredValue) >= 0)) {
      errors.declaredValue = 'Enter the declared value';
    }
  }
  return errors;
}

function patchForStep(step: number, form: Form): ShipmentUpdate {
  if (step === 0) {
    return {
      senderIsSelf: form.senderIsSelf ?? false,
      senderName: form.senderName.trim(),
      senderPhone: form.senderPhone.trim(),
      senderAddress: form.senderAddress.trim(),
      pickupZone: form.pickupZone.trim(),
      ...(form.pickupDate ? { pickupDate: toIsoDate(form.pickupDate) } : {}),
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [price, setPrice] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<Shipment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('balance');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [checkout, setCheckout] = useState<{ authorizationUrl: string; reference: string } | null>(
    null,
  );
  const [payError, setPayError] = useState<string | null>(null);
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

  const finalizeBooking = async (booked: Shipment) => {
    successFeedback();
    try {
      updateUser({ balanceKobo: await getWalletBalance() });
    } catch {
      // Non-fatal: balance refreshes on next load.
    }
    setConfirmed(booked);
    queryClient.invalidateQueries({ queryKey: ['shipments'] });
  };

  const payBalance = useMutation({
    mutationFn: () => payWithBalance(id as string, termsAccepted),
    onSuccess: finalizeBooking,
    onError: (mutationError) => setPayError(getApiErrorMessage(mutationError)),
  });

  const initPaystack = useMutation({
    mutationFn: () => initPaystackForShipment(id as string, termsAccepted),
    onSuccess: (init) => setCheckout(init),
    onError: (mutationError) => setPayError(getApiErrorMessage(mutationError)),
  });

  const handlePay = () => {
    setPayError(null);
    if (paymentMethod === 'balance') {
      payBalance.mutate();
    } else {
      initPaystack.mutate();
    }
  };

  const handleCheckoutResult = async (result: VerifyResult) => {
    setCheckout(null);
    if (result.success) {
      await finalizeBooking(await getShipment(id as string));
      return;
    }
    // Cancelled/abandoned: close quietly — the shipment stays a resumable draft.
    // A genuine failure (e.g. declined card) gets a gentle nudge.
    if (result.status && result.status !== 'abandoned') {
      toast('Payment didn’t go through. Your shipment is saved — try again anytime.');
    }
  };

  const payPending = payBalance.isPending || initPaystack.isPending || checkout != null;

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

  const clearErrors = (keys: (keyof Form)[]) =>
    setErrors((current) => {
      if (!keys.some((key) => key in current)) {
        return current;
      }
      const next = { ...current };
      keys.forEach((key) => delete next[key]);
      return next;
    });

  const setField = (key: keyof Form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    clearErrors([key]);
  };

  const patchForm = (partial: Partial<Form>) => {
    setForm((current) => ({ ...current, ...partial }));
    clearErrors(Object.keys(partial) as (keyof Form)[]);
  };

  const handleBack = () => {
    setErrors({});
    if (step === 0) {
      router.back();
    } else {
      setStep((current) => current - 1);
    }
  };

  const handleContinue = async () => {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
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
              errors={errors}
              defaultName={user?.fullName ?? ''}
              defaultPhone={user?.phoneNumber ?? ''}
            />
          ) : null}

          {step === 1 ? (
            <ReceiverStep values={form} onChange={patchForm} errors={errors} />
          ) : null}

          {step === 2 ? (
            <>
              <SelectField
                label="Item category"
                required
                error={errors.packageCategory}
                value={form.packageCategory || null}
                options={ITEM_CATEGORY_OPTIONS}
                onChange={setField('packageCategory')}
                placeholder="Select item category"
              />
              <TextField
                label="Weight (kg)"
                required
                error={errors.weightKg}
                value={form.weightKg}
                onChangeText={setField('weightKg')}
                placeholder="e.g. 2.5"
                keyboardType="decimal-pad"
              />
              <TextField
                label="Declared value (₦)"
                required
                error={errors.declaredValue}
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

          {saveStep.isError || payError ? (
            <Text className="text-sm text-red-500">
              {payError ?? getApiErrorMessage(saveStep.error)}
            </Text>
          ) : null}
        </ScrollView>

        <View className="gap-2 px-6 pb-2">
          {step < 3 ? (
            <Button label="Continue" loading={saveStep.isPending} onPress={handleContinue} />
          ) : (
            <>
              <Button
                label={price != null ? `Pay ${formatNaira(price)}` : 'Pay'}
                disabled={!termsAccepted}
                loading={payPending}
                onPress={handlePay}
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

      <PaystackCheckout
        authorizationUrl={checkout?.authorizationUrl ?? null}
        reference={checkout?.reference ?? null}
        onCancel={() => setCheckout(null)}
        onResult={handleCheckoutResult}
      />
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
          form.pickupDate ? `Pickup: ${formatDate(form.pickupDate)}` : '',
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
