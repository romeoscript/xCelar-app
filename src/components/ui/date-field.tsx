import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Button } from './button';
import { BottomSheet } from './bottom-sheet';
import { FieldLabel } from './field-label';

export type DateFieldProps = {
  label: string;
  required?: boolean;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

// A sensible starting point for a date-of-birth spinner.
const DEFAULT_DATE = new Date(2000, 0, 1);

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function clampToRange(date: Date, min?: Date, max?: Date): Date {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

export function DateField({
  label,
  required,
  value,
  onChange,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const initialDraft = clampToRange(value ?? DEFAULT_DATE, minimumDate, maximumDate);
  const [draft, setDraft] = useState<Date>(initialDraft);

  const openPicker = () => {
    const start = clampToRange(value ?? DEFAULT_DATE, minimumDate, maximumDate);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: start,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (_event, date) => {
          if (date) {
            onChange(date);
          }
        },
      });
      return;
    }
    setDraft(start);
    setIosOpen(true);
  };

  return (
    <View className="gap-2">
      <FieldLabel label={label} required={required} />
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
          <View className="my-2">
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              themeVariant="light"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              style={{ height: 200 }}
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
