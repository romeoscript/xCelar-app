import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { FieldFrame, type FieldIcon } from './field-frame';
import { FieldLabel } from './field-label';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  required?: boolean;
  /** Shown at the start of the field and lit up while it has focus. */
  icon?: FieldIcon;
};

export function TextField({ label, error, required, secureTextEntry, icon, onFocus, onBlur, ...rest }: TextFieldProps) {
  const isPassword = Boolean(secureTextEntry);
  const [isHidden, setIsHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  const toggle = isPassword ? (
    <Pressable
      onPress={() => setIsHidden((hidden) => !hidden)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isHidden ? 'Show password' : 'Hide password'}
      className="h-12 w-11 items-center justify-center active:opacity-70"
    >
      {isHidden ? <EyeIcon size={22} color={Brand.muted} /> : <EyeOffIcon size={22} color={Brand.muted} />}
    </Pressable>
  ) : null;

  return (
    <View className="gap-2">
      <FieldLabel label={label} required={required} />
      <FieldFrame focused={focused} error={error} icon={icon} trailing={toggle}>
        <TextInput
          placeholderTextColor={Brand.muted}
          secureTextEntry={isPassword && isHidden}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className={`h-12 text-base text-gray-900 ${isPassword ? '' : 'pr-4'}`}
          {...rest}
        />
      </FieldFrame>
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
