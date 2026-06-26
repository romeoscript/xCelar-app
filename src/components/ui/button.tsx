import { Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
};

const containerByVariant: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue',
  secondary: 'bg-brand-mist',
};

const labelByVariant: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-brand-navy',
};

export function Button({ label, variant = 'primary', className, ...rest }: ButtonProps) {
  return (
    <Pressable
      className={`h-16 items-center justify-center rounded-full px-6 active:opacity-90 ${containerByVariant[variant]} ${className ?? ''}`}
      {...rest}
    >
      <Text className={`text-lg font-semibold ${labelByVariant[variant]}`}>{label}</Text>
    </Pressable>
  );
}
