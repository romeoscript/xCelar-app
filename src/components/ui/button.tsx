import {
  ActivityIndicator,
  type GestureResponderEvent,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';

type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

const containerByVariant: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue',
  secondary: 'bg-brand-mist',
};

const labelByVariant: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-brand-navy',
};

const spinnerByVariant: Record<ButtonVariant, string> = {
  primary: '#ffffff',
  secondary: Brand.navy,
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = (event: GestureResponderEvent) => {
    tapFeedback();
    onPress?.(event);
  };

  return (
    <Pressable
      disabled={isDisabled}
      onPress={handlePress}
      className={`h-16 items-center justify-center rounded-full px-6 ${containerByVariant[variant]} ${isDisabled ? 'opacity-60' : 'active:scale-[0.98] active:opacity-90'} ${className ?? ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerByVariant[variant]} />
      ) : (
        <Text className={`text-lg font-semibold ${labelByVariant[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
