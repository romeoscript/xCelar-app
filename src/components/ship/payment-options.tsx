import { Pressable, Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';

export type PaymentMethod = 'balance' | 'paystack' | 'cod' | 'account';

/** An approved business's room to book on account; `blockedReason` explains when it can't. */
export type AccountOption = { availableNaira: number; blockedReason: string | null };

export type PaymentOptionsProps = {
  price: number | null;
  balanceKobo: number;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onOpenTerms: () => void;
  /** Foreign-currency shipments (e.g. USD imports) can only be paid by card. */
  cardOnly?: boolean;
  /** Local deliveries can be paid in cash to the delivery rider. */
  allowPayOnDelivery?: boolean;
  /** Set for approved businesses: book now, billed on the monthly invoice. */
  businessAccount?: AccountOption | null;
};

export function PaymentOptions({
  price,
  balanceKobo,
  method,
  onMethodChange,
  termsAccepted,
  onTermsChange,
  onOpenTerms,
  cardOnly = false,
  allowPayOnDelivery = false,
  businessAccount = null,
}: PaymentOptionsProps) {
  const balance = balanceKobo / 100;
  const insufficient = price != null && balance < price;
  const accountUnavailable =
    businessAccount?.blockedReason ??
    (businessAccount && price != null && businessAccount.availableNaira < price ? 'Over your remaining credit' : null);

  const select = (next: PaymentMethod) => {
    tapFeedback();
    onMethodChange(next);
  };

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-brand-navy">Payment method</Text>

      {cardOnly ? (
        <Text className="text-sm text-gray-500">
          International orders are paid by card. Your card is charged the Naira amount shown.
        </Text>
      ) : (
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
      )}

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

      {businessAccount ? (
        <Pressable
          disabled={Boolean(accountUnavailable)}
          onPress={() => select('account')}
          className={`flex-row items-center justify-between rounded-2xl border p-4 ${
            method === 'account' && !accountUnavailable ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
          } ${accountUnavailable ? 'opacity-60' : 'active:opacity-80'}`}
        >
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold text-gray-900">Business account</Text>
            <Text className={`text-sm ${accountUnavailable ? 'text-red-500' : 'text-gray-500'}`}>
              {accountUnavailable ?? `On this month’s invoice · ${formatNaira(businessAccount.availableNaira)} credit left`}
            </Text>
          </View>
          <RadioDot selected={method === 'account' && !accountUnavailable} />
        </Pressable>
      ) : null}

      {allowPayOnDelivery ? (
        <Pressable
          onPress={() => select('cod')}
          className={`flex-row items-center justify-between rounded-2xl border p-4 active:opacity-80 ${
            method === 'cod' ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
          }`}
        >
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold text-gray-900">Pay on delivery</Text>
            <Text className="text-sm text-gray-500">Pay the rider in cash when it&apos;s delivered</Text>
          </View>
          <RadioDot selected={method === 'cod'} />
        </Pressable>
      ) : null}

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
