import { Text } from 'react-native';

export type FieldLabelProps = {
  label?: string;
  required?: boolean;
};

/** A form field label, with a red asterisk when the field is required. */
export function FieldLabel({ label, required }: FieldLabelProps) {
  if (!label) {
    return null;
  }
  return (
    <Text className="text-sm font-medium text-gray-700">
      {label}
      {required ? <Text className="text-red-500"> *</Text> : null}
    </Text>
  );
}
