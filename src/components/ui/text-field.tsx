import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { Brand } from '@/constants/theme';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...rest }: TextFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-brand-mist">{label}</Text>
      <TextInput
        placeholderTextColor={Brand.muted}
        className="h-14 rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white"
        {...rest}
      />
      {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
    </View>
  );
}
