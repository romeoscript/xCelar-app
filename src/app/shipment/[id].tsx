import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { PaidBadge, StatusBadge } from '@/components/shipments/badges';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { getShipment, type Shipment } from '@/lib/shipment-api';
import { DELIVERY_STAGES } from '@/lib/shipment-status';

export default function ShipmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => getShipment(id as string),
    enabled: Boolean(id),
  });

  if (!id) {
    return <Redirect href="/home" />;
  }

  const shipment = query.data;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <View className="px-6 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
        >
          <ChevronLeftIcon size={22} color={Brand.navy} />
        </Pressable>
      </View>

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : shipment ? (
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <View className="gap-2">
            <Text className="text-xs uppercase tracking-wider text-gray-500">Tracking code</Text>
            <Text className="text-2xl font-extrabold text-brand-navy">
              {shipment.trackingCode ?? 'Not booked yet'}
            </Text>
            <View className="flex-row gap-2">
              <StatusBadge status={shipment.status} />
              <PaidBadge paid={shipment.paid} />
            </View>
          </View>

          {shipment.status !== 'CANCELLED' && shipment.status !== 'DRAFT' ? (
            <DeliveryTimeline shipment={shipment} />
          ) : null}

          <DetailCard
            title="Sender"
            lines={[
              shipment.senderName,
              shipment.senderPhone,
              shipment.senderAddress,
              shipment.pickupZone ? `Zone: ${shipment.pickupZone}` : null,
            ]}
          />
          <DetailCard
            title="Receiver"
            lines={[
              shipment.receiverName,
              shipment.receiverPhone,
              shipment.receiverAddress,
              shipment.deliveryZone ? `Zone: ${shipment.deliveryZone}` : null,
            ]}
          />
          <DetailCard
            title="Package"
            lines={[
              shipment.packageCategory,
              shipment.weightKg != null ? `${shipment.weightKg} kg` : null,
              shipment.fragile ? 'Fragile' : null,
              shipment.description,
            ]}
          />

          <View className="rounded-2xl bg-brand-surface p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-brand-navy">Amount</Text>
              <Text className="text-lg font-extrabold text-brand-navy">
                {shipment.priceEstimate != null ? formatNaira(shipment.priceEstimate) : '—'}
              </Text>
            </View>
            {shipment.paymentMethod ? (
              <Text className="mt-1 text-sm text-gray-500">
                Paid with {shipment.paymentMethod === 'BALANCE' ? 'wallet balance' : 'card / Paystack'}
              </Text>
            ) : (
              <Text className="mt-1 text-sm text-amber-600">Payment pending</Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-gray-500">Shipment not found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function DeliveryTimeline({ shipment }: { shipment: Shipment }) {
  const currentIndex = DELIVERY_STAGES.findIndex((stage) => stage.status === shipment.status);

  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-5">
      <Text className="mb-3 text-base font-semibold text-brand-navy">Delivery progress</Text>
      {DELIVERY_STAGES.map((stage, index) => {
        const reached = index <= currentIndex;
        const isLast = index === DELIVERY_STAGES.length - 1;
        return (
          <View key={stage.status} className="flex-row">
            <View className="items-center">
              <View
                className={`h-4 w-4 rounded-full ${reached ? 'bg-brand-blue' : 'bg-gray-200'}`}
              />
              {!isLast ? (
                <View className={`my-0.5 w-0.5 flex-1 ${reached ? 'bg-brand-blue' : 'bg-gray-200'}`} />
              ) : null}
            </View>
            <Text
              className={`ml-3 pb-4 text-base ${reached ? 'font-semibold text-gray-900' : 'text-gray-400'}`}
            >
              {stage.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function DetailCard({ title, lines }: { title: string; lines: (string | null)[] }) {
  const visible = lines.filter(Boolean) as string[];
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-4">
      <Text className="text-xs uppercase tracking-wider text-gray-500">{title}</Text>
      {visible.map((line, index) => (
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
