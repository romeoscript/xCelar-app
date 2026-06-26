import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { Brand } from '@/constants/theme';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...rest }: TextFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gray-700">{label}</Text>
      <TextInput
        placeholderTextColor={Brand.muted}
        className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900"
        {...rest}
      />
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
