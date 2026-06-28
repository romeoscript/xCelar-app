import { Text, View } from 'react-native';

import { Button } from './button';

export type QueryErrorProps = {
  message?: string;
  onRetry: () => void;
};

/** Full-height "something went wrong" state with a retry action. */
export function QueryError({ message = 'Something went wrong.', onRetry }: QueryErrorProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-10">
      <Text className="text-center text-base text-gray-500">{message}</Text>
      <View className="w-40">
        <Button label="Try again" variant="secondary" onPress={onRetry} />
      </View>
    </View>
  );
}
