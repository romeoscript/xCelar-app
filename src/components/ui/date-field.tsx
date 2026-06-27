import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Button } from './button';
import { BottomSheet } from './bottom-sheet';

export type DateFieldProps = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  maximumDate?: Date;
};

// A sensible starting point for a date-of-birth spinner.
const DEFAULT_DATE = new Date(2000, 0, 1);

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  maximumDate,
}: DateFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? DEFAULT_DATE);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? DEFAULT_DATE,
        mode: 'date',
        maximumDate,
        onChange: (_event, date) => {
          if (date) {
            onChange(date);
          }
        },
      });
      return;
    }
    setDraft(value ?? DEFAULT_DATE);
    setIosOpen(true);
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gray-700">{label}</Text>
      <Pressable
        onPress={openPicker}
        className="h-14 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 active:opacity-70"
      >
        <Text className={`text-base ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text className="text-xs text-gray-400">▾</Text>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <BottomSheet visible={iosOpen} onClose={() => setIosOpen(false)}>
          <Text className="text-xl font-bold text-brand-navy">{label}</Text>
          <View className="items-center">
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              maximumDate={maximumDate}
              onChange={(_event, date) => {
                if (date) {
                  setDraft(date);
                }
              }}
            />
          </View>
          <Button
            label="Done"
            onPress={() => {
              onChange(draft);
              setIosOpen(false);
            }}
          />
        </BottomSheet>
      ) : null}
    </View>
  );
}
