import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Text className="text-2xl font-bold text-white">X</Text>
        </View>
        <Text className="text-2xl font-bold text-ink">Xcellar</Text>
        <Text className="text-center text-base text-neutral-500">
          Fresh React Native + Expo app. Foundation is wired: Expo Router,
          NativeWind, TanStack Query, Zustand, axios, SecureStore.
        </Text>
      </View>
    </SafeAreaView>
  );
}
