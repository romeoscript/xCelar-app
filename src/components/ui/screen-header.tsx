import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChevronLeftIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';

export type ScreenHeaderProps = {
  title?: string;
};

/** Back button plus an optional title — the standard top bar for stack screens. */
export function ScreenHeader({ title }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center gap-3 px-6 pt-2">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
      >
        <ChevronLeftIcon size={22} color={Brand.navy} />
      </Pressable>
      {title ? <Text className="text-xl font-bold text-brand-navy">{title}</Text> : null}
    </View>
  );
}
