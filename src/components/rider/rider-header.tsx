import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';

export type RiderHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** 1-based current step; renders a segmented progress rail when set. */
  step?: number;
  totalSteps?: number;
};

/** The navy "dispatch" hero used across rider screens — sets the rider section
 *  apart from the bright customer app and carries onboarding progress. */
export function RiderHeader({ eyebrow, title, subtitle, onBack, step, totalSteps }: RiderHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="rounded-b-3xl bg-brand-night px-6 pb-7" style={{ paddingTop: insets.top + 12 }}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          className="mb-5 h-10 w-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
        >
          <ChevronLeftIcon size={22} color="#ffffff" />
        </Pressable>
      ) : null}

      {step && totalSteps ? (
        <View className="mb-5 flex-row gap-1.5">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              className={`h-1.5 flex-1 rounded-full ${index < step ? 'bg-brand-gold' : 'bg-white/15'}`}
            />
          ))}
        </View>
      ) : null}

      {eyebrow ? (
        <Text className="mb-1 text-xs font-semibold uppercase tracking-[2px] text-brand-gold">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="text-[26px] font-extrabold leading-8 text-white">{title}</Text>
      {subtitle ? <Text className="mt-2 text-sm leading-5 text-white/70">{subtitle}</Text> : null}
    </View>
  );
}
