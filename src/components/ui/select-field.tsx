import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { BottomSheet } from './bottom-sheet';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export type SelectFieldProps<T extends string> = {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
};

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
}: SelectFieldProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const select = (next: T) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gray-700">{label}</Text>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="h-14 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 active:opacity-70"
      >
        <Text className={`text-base ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text className="text-xs text-gray-400">▾</Text>
      </Pressable>

      <BottomSheet visible={isOpen} onClose={() => setIsOpen(false)}>
        <Text className="text-xl font-bold text-brand-navy">{label}</Text>
        <FlatList
          data={options}
          keyExtractor={(option) => option.value}
          style={{ maxHeight: 360 }}
          className="mt-2"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = item.value === value;
            return (
              <Pressable
                onPress={() => select(item.value)}
                className="flex-row items-center justify-between py-3 active:opacity-60"
              >
                <Text
                  className={`text-base ${isSelected ? 'font-semibold text-brand-blue' : 'text-gray-900'}`}
                >
                  {item.label}
                </Text>
                {isSelected ? <Text className="text-base font-bold text-brand-blue">✓</Text> : null}
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </View>
  );
}
