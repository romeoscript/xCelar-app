import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-brand-night">
      <StatusBar style="light" />

      <View className="px-6 pt-2">
        <Pressable onPress={() => router.back()} className="active:opacity-70">
          <Text className="text-base text-brand-blue-light">Back</Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-white">Welcome back</Text>
        <Text className="mt-2 text-center text-base text-brand-mist">
          Sign-in flow coming next.
        </Text>
      </View>
    </SafeAreaView>
  );
}
