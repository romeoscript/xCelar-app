import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BellIcon } from '@/components/icons';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';

export default function RiderNotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Notifications" />
      <View className="flex-1 items-center justify-center gap-3 px-10">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-surface">
          <BellIcon size={28} color={Brand.muted} />
        </View>
        <Text className="text-lg font-bold text-brand-navy">You’re all caught up</Text>
        <Text className="text-center text-sm text-gray-500">
          New delivery requests and updates will show up here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
