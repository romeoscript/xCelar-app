import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Who we are',
    body: 'Xcelar is a logistics platform that makes sending packages simple — book a local delivery, track it in real time, and pay straight from your wallet.',
  },
  {
    title: 'What we do',
    body: 'We connect senders with vetted delivery partners and handle pricing, pickup, and proof of delivery so your package gets where it needs to go.',
  },
  {
    title: 'Our promise',
    body: 'Clear pricing, careful handling, and support whenever you need it. We are building the most reliable way to move things across the country.',
  },
];

export default function AboutScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="About us" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
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
