import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { tapFeedback } from '@/lib/haptics';
import { rateDelivery, type Shipment } from '@/lib/shipment-api';

const STARS = [1, 2, 3, 4, 5] as const;
const COMMENT_MAX_LENGTH = 500;

/** Rate the rider after delivery; once rated, shows the rating given. */
export function RateRiderCard({ shipment }: { shipment: Shipment }) {
  const queryClient = useQueryClient();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  const submit = useMutation({
    mutationFn: () => rateDelivery(shipment.id, { stars, comment: comment.trim() || undefined }),
    onSuccess: (updated) => queryClient.setQueryData(['shipment', shipment.id], updated),
  });

  if (shipment.rating) {
    return (
      <View className="gap-2 rounded-2xl border border-gray-100 bg-white p-4">
        <Text className="text-base font-semibold text-brand-navy">Your rating</Text>
        <StarRow value={shipment.rating.stars} />
        {shipment.rating.comment ? (
          <Text className="text-sm text-gray-600">“{shipment.rating.comment}”</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <View>
        <Text className="text-base font-semibold text-brand-navy">How was your rider?</Text>
        <Text className="text-sm text-gray-500">Your rating helps us keep deliveries great.</Text>
      </View>
      <StarRow
        value={stars}
        onChange={(value) => {
          tapFeedback();
          setStars(value);
        }}
      />
      {stars > 0 ? (
        <>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Anything to add? (optional)"
            placeholderTextColor={Brand.muted}
            maxLength={COMMENT_MAX_LENGTH}
            multiline
            className="min-h-[72px] rounded-xl bg-brand-surface px-4 py-3 text-base text-gray-900"
          />
          {submit.isError ? (
            <Text className="text-sm text-red-500">{getApiErrorMessage(submit.error)}</Text>
          ) : null}
          <Button label="Submit rating" loading={submit.isPending} onPress={() => submit.mutate()} />
        </>
      ) : null}
    </View>
  );
}

function StarRow({ value, onChange }: { value: number; onChange?: (value: number) => void }) {
  return (
    <View className="flex-row gap-1.5" accessibilityRole={onChange ? 'adjustable' : undefined}>
      {STARS.map((star) => {
        const icon = (
          <MaterialCommunityIcons
            name={star <= value ? 'star' : 'star-outline'}
            size={32}
            color={star <= value ? Brand.gold : Brand.muted}
          />
        );
        return onChange ? (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}
