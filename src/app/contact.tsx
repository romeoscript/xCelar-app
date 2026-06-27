import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MailIcon, PhoneCallIcon, type IconProps } from '@/components/icons';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';

const SUPPORT_EMAIL = 'support@xcelar.app';
const SUPPORT_PHONE = '+2348000000000';

type ContactMethod = {
  icon: (props: IconProps) => React.JSX.Element;
  label: string;
  value: string;
  url: string;
};

const METHODS: ContactMethod[] = [
  { icon: MailIcon, label: 'Email us', value: SUPPORT_EMAIL, url: `mailto:${SUPPORT_EMAIL}` },
  { icon: PhoneCallIcon, label: 'Call us', value: SUPPORT_PHONE, url: `tel:${SUPPORT_PHONE}` },
];

export default function ContactScreen() {
  const open = (url: string) => {
    tapFeedback();
    void Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Contact us" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text className="text-base leading-6 text-gray-600">
          We are here to help. Reach our support team and we will get back to you as soon as we can.
        </Text>

        {METHODS.map((method) => {
          const { icon: Icon } = method;
          return (
            <Pressable
              key={method.label}
              onPress={() => open(method.url)}
              className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 active:bg-gray-50"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-blue-tint">
                <Icon size={20} color={Brand.blue} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">{method.label}</Text>
                <Text className="text-sm text-gray-500">{method.value}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
