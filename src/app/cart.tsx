import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MinusIcon, PlusIcon } from '@/components/icons';
import { AddressField, type AddressValue } from '@/components/ship/address-field';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { cartSubtotalKobo, useCartStore } from '@/lib/cart-store';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { createOrder } from '@/lib/marketplace-api';
import { useAuthStore } from '@/lib/auth-store';

const EMPTY_ADDRESS: AddressValue = { address: '', lat: null, lng: null };

export default function CartScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const vendor = useCartStore((state) => state.vendor);
  const lines = useCartStore((state) => state.lines);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const clear = useCartStore((state) => state.clear);

  const [receiverName, setReceiverName] = useState(user?.fullName ?? '');
  const [receiverPhone, setReceiverPhone] = useState(user?.phoneNumber ?? '');
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [zone, setZone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const placeOrder = useMutation({
    mutationFn: () =>
      createOrder({
        vendorId: vendor?.id ?? '',
        items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        receiverName: receiverName.trim(),
        receiverPhone,
        deliveryAddress: address.address.trim(),
        ...(address.lat != null && address.lng != null
          ? { deliveryLat: address.lat, deliveryLng: address.lng }
          : {}),
        ...(zone ? { deliveryZone: zone } : {}),
      }),
    onSuccess: (order) => {
      clear();
      router.replace(`/order/${order.id}`);
    },
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });

  const handlePlaceOrder = () => {
    if (!receiverName.trim()) {
      setError("Enter the recipient's name.");
      return;
    }
    if (receiverPhone.trim().length < 7) {
      setError('Enter a valid phone number.');
      return;
    }
    if (!address.address.trim()) {
      setError('Add a delivery address.');
      return;
    }
    setError(null);
    placeOrder.mutate();
  };

  if (!vendor || lines.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <ScreenHeader title="Cart" />
        <View className="flex-1 items-center justify-center gap-3 px-10">
          <Text className="text-lg font-bold text-brand-navy">Your cart is empty</Text>
          <Text className="text-center text-sm text-gray-500">
            Browse partners and add items to get started.
          </Text>
          <Button label="Browse marketplace" onPress={() => router.replace('/marketplace')} />
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = cartSubtotalKobo(lines);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title={vendor.name} />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            {lines.map((line) => (
              <View
                key={line.product.id}
                className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3"
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">{line.product.name}</Text>
                  <Text className="text-sm text-gray-500">
                    {formatNaira(line.product.priceKobo / 100)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Stepper
                    icon={MinusIcon}
                    onPress={() => setQuantity(line.product.id, line.quantity - 1)}
                  />
                  <Text className="w-5 text-center text-base font-bold text-brand-navy">
                    {line.quantity}
                  </Text>
                  <Stepper
                    icon={PlusIcon}
                    onPress={() => setQuantity(line.product.id, line.quantity + 1)}
                  />
                </View>
              </View>
            ))}
          </View>

          <View className="gap-4">
            <Text className="text-base font-bold text-brand-navy">Delivery details</Text>
            <TextField
              label="Recipient's name"
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder="Full name"
              autoCapitalize="words"
            />
            <PhoneInput
              label="Recipient's phone"
              value={receiverPhone}
              onChange={setReceiverPhone}
            />
            <AddressField
              label="Delivery address"
              value={address}
              onChange={setAddress}
              onZoneHint={(area, region) => setZone(area ?? region ?? '')}
            />
          </View>

          <View className="rounded-2xl bg-brand-surface p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-500">Items subtotal</Text>
              <Text className="text-sm font-semibold text-gray-900">{formatNaira(subtotal / 100)}</Text>
            </View>
            <Text className="mt-1 text-xs text-gray-400">
              Delivery fee is calculated from the vendor to your address on the next step.
            </Text>
          </View>

          {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

          <Button
            label="Place order"
            loading={placeOrder.isPending}
            onPress={handlePlaceOrder}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stepper({ icon: Icon, onPress }: { icon: typeof PlusIcon; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className="h-8 w-8 items-center justify-center rounded-full bg-brand-blue active:opacity-80"
    >
      <Icon size={16} color="#ffffff" />
    </Pressable>
  );
}
