import { View } from 'react-native';

export type StepIndicatorProps = {
  /** Zero-based index of the current step. */
  step: number;
  total: number;
};

export function StepIndicator({ step, total }: StepIndicatorProps) {
  return (
    <View className="flex-row gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-brand-blue' : 'bg-gray-200'}`}
        />
      ))}
    </View>
  );
}
