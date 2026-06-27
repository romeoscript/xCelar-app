import { Pressable, Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';

export type PaymentMethod = 'balance' | 'paystack';

export type PaymentOptionsProps = {
  price: number | null;
  balanceKobo: number;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onOpenTerms: () => void;
};

export function PaymentOptions({
  price,
  balanceKobo,
  method,
  onMethodChange,
  termsAccepted,
  onTermsChange,
  onOpenTerms,
}: PaymentOptionsProps) {
  const balance = balanceKobo / 100;
  const insufficient = price != null && balance < price;

  const select = (next: PaymentMethod) => {
    tapFeedback();
    onMethodChange(next);
  };

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-brand-navy">Payment method</Text>

      <Pressable
        disabled={insufficient}
        onPress={() => select('balance')}
        className={`flex-row items-center justify-between rounded-2xl border p-4 ${
          method === 'balance' && !insufficient
            ? 'border-brand-blue bg-brand-blue-tint'
            : 'border-gray-200 bg-white'
        } ${insufficient ? 'opacity-60' : 'active:opacity-80'}`}
      >
        <View>
          <Text className="text-base font-semibold text-gray-900">Wallet balance</Text>
          <Text className={`text-sm ${insufficient ? 'text-red-500' : 'text-gray-500'}`}>
            {formatNaira(balance)}
            {insufficient ? ' · insufficient' : ' available'}
          </Text>
        </View>
        <RadioDot selected={method === 'balance' && !insufficient} />
      </Pressable>

      <Pressable
        onPress={() => select('paystack')}
        className={`flex-row items-center justify-between rounded-2xl border p-4 active:opacity-80 ${
          method === 'paystack' ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
        }`}
      >
        <View>
          <Text className="text-base font-semibold text-gray-900">Card / bank</Text>
          <Text className="text-sm text-gray-500">Pay securely with Paystack</Text>
        </View>
        <RadioDot selected={method === 'paystack'} />
      </Pressable>

      <Pressable
        onPress={() => {
          tapFeedback();
          onTermsChange(!termsAccepted);
        }}
        className="mt-1 flex-row items-center gap-3 active:opacity-70"
      >
        <View
          className={`h-6 w-6 items-center justify-center rounded-md border ${
            termsAccepted ? 'border-brand-blue bg-brand-blue' : 'border-gray-300 bg-white'
          }`}
        >
          {termsAccepted ? <Text className="text-xs font-bold text-white">✓</Text> : null}
        </View>
        <Text className="flex-1 text-sm text-gray-600">
          I agree to the{' '}
          <Text
            className="font-semibold text-brand-blue"
            onPress={onOpenTerms}
          >
            Terms &amp; Conditions
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <View
      className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
        selected ? 'border-brand-blue' : 'border-gray-300'
      }`}
    >
      {selected ? <View className="h-3 w-3 rounded-full bg-brand-blue" /> : null}
    </View>
  );
}
