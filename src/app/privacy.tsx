import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/screen-header';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. What we collect',
    body: 'We collect the details you provide — your name, email, phone number, and the pickup and delivery addresses for your shipments — plus basic device information used to keep your account secure.',
  },
  {
    title: '2. How we use it',
    body: 'Your data is used to book and track deliveries, process payments, and contact you about your shipments. We do not sell your personal information.',
  },
  {
    title: '3. Sharing',
    body: 'We share only what a delivery partner needs to complete your booking — typically the recipient name, phone number, and address.',
  },
  {
    title: '4. Security',
    body: 'Passwords are hashed and access tokens are stored securely on your device. You can enable biometric unlock for an extra layer of protection.',
  },
  {
    title: '5. Your choices',
    body: 'You can edit your profile, manage saved addresses, or delete your account and its data at any time from the Account screen.',
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Privacy policy" />
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
