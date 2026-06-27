import { Children, Fragment, type ReactNode } from 'react';
import { Text, View } from 'react-native';

export type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

/** A titled card that groups SettingsRow children with hairline dividers. */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  const rows = Children.toArray(children);

  return (
    <View className="gap-3">
      <Text className="text-base font-bold text-brand-navy">{title}</Text>
      <View className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <View className="h-px bg-gray-100" /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}
