import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'How do I book a delivery?',
    answer: 'Tap "Ship locally" on the home screen, then add the sender, recipient, and package details. You will see a price before you confirm.',
  },
  {
    question: 'How is the price calculated?',
    answer: 'Pricing is based on the distance between pickup and delivery, the package weight, and any special handling such as fragile items.',
  },
  {
    question: 'How do I pay?',
    answer: 'You can pay from your wallet balance or with a card via Paystack. Top up your wallet any time from the home screen.',
  },
  {
    question: 'Can I track my shipment?',
    answer: 'Yes. Open the shipment from the Shipments tab to see its current status, or enter your tracking ID on the home screen.',
  },
  {
    question: 'How do I get a refund?',
    answer: 'If a booking is cancelled before pickup, any amount due is returned to your wallet balance.',
  },
];

export default function FaqScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="FAQ" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        {FAQS.map((item) => (
          <View key={item.question} className="gap-1.5 rounded-2xl border border-gray-100 bg-white p-4">
            <Text className="text-base font-semibold text-brand-navy">{item.question}</Text>
            <Text className="text-base leading-6 text-gray-600">{item.answer}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
