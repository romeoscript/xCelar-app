import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, secureTextEntry, ...rest }: TextFieldProps) {
  const isPassword = Boolean(secureTextEntry);
  const [isHidden, setIsHidden] = useState(true);

  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-medium text-gray-700">{label}</Text> : null}
      <View>
        <TextInput
          placeholderTextColor={Brand.muted}
          secureTextEntry={isPassword && isHidden}
          className={`h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-900 ${isPassword ? 'pr-12' : ''}`}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setIsHidden((hidden) => !hidden)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isHidden ? 'Show password' : 'Hide password'}
            className="absolute right-2 h-14 w-10 items-center justify-center active:opacity-70"
          >
            {isHidden ? (
              <EyeIcon size={22} color={Brand.muted} />
            ) : (
              <EyeOffIcon size={22} color={Brand.muted} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
