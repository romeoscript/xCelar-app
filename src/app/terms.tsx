import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. Service',
    body: 'Xcelar connects senders with delivery partners to move packages between the pickup and delivery addresses you provide. You are responsible for the accuracy of those details.',
  },
  {
    title: '2. Pricing & payment',
    body: 'Delivery fees are estimated from distance, weight, and handling. Payment is taken upfront from your wallet balance or via Paystack before a booking is confirmed.',
  },
  {
    title: '3. Prohibited items',
    body: 'You may not ship illegal, hazardous, perishable, or restricted goods. Declaring an item incorrectly may lead to cancellation without refund.',
  },
  {
    title: '4. Liability',
    body: 'Xcelar takes reasonable care of your package. Fragile items should be marked as such. Our liability is limited to the declared value of the item where applicable.',
  },
  {
    title: '5. Cancellations & refunds',
    body: 'A booking may be cancelled before pickup. Refunds, where due, are returned to your wallet balance.',
  },
];

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
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

      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text className="text-2xl font-extrabold text-brand-navy">Terms &amp; Conditions</Text>
        {SECTIONS.map((section) => (
          <View key={section.title} className="gap-1">
            <Text className="text-base font-semibold text-gray-900">{section.title}</Text>
            <Text className="text-base leading-6 text-gray-600">{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
