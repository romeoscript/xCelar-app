import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ComingSoonProps = {
  title: string;
  message?: string;
};

/** Simple placeholder for tabs/screens whose feature isn't built yet. */
export function ComingSoon({ title, message = 'Coming soon.' }: ComingSoonProps) {
  return (
    <SafeAreaView className="flex-1 bg-white px-6" edges={['top']}>
      <Text className="mt-2 text-2xl font-bold text-brand-navy">{title}</Text>
      <View className="flex-1 items-center justify-center">
        <Text className="text-base text-gray-500">{message}</Text>
      </View>
    </SafeAreaView>
  );
}
