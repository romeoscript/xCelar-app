import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Brand } from '@/constants/theme';
import { verifyPayment, type VerifyResult } from '@/lib/wallet-api';

// Must match PAYSTACK_CALLBACK_URL on the backend.
const CALLBACK_URL = 'https://xcelar.app/paystack/callback';

export type PaystackCheckoutProps = {
  authorizationUrl: string | null;
  reference: string | null;
  onCancel: () => void;
  onResult: (result: VerifyResult) => void;
};

/**
 * In-app Paystack checkout. Loads the authorization URL in a WebView and, when
 * Paystack redirects to the callback sentinel, verifies the transaction by its
 * reference and reports the result — no external browser.
 */
export function PaystackCheckout({
  authorizationUrl,
  reference,
  onCancel,
  onResult,
}: PaystackCheckoutProps) {
  const [verifying, setVerifying] = useState(false);
  const visible = Boolean(authorizationUrl && reference);

  const completeWith = async () => {
    if (!reference || verifying) {
      return;
    }
    setVerifying(true);
    try {
      onResult(await verifyPayment(reference));
    } catch {
      onResult({ purpose: '', success: false });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-6 py-2">
          <Text className="text-lg font-bold text-brand-navy">Complete payment</Text>
          <Pressable onPress={onCancel} hitSlop={8} className="active:opacity-70">
            <Text className="text-base font-semibold text-brand-blue">Cancel</Text>
          </Pressable>
        </View>

        <View className="flex-1 overflow-hidden">
          {authorizationUrl ? (
            <WebView
              source={{ uri: authorizationUrl }}
              onShouldStartLoadWithRequest={(request) => {
                if (request.url.startsWith(CALLBACK_URL)) {
                  void completeWith();
                  return false;
                }
                return true;
              }}
            />
          ) : null}
        </View>

        {verifying ? (
          <View className="absolute inset-0 items-center justify-center bg-white/80">
            <ActivityIndicator color={Brand.blue} />
            <Text className="mt-2 text-base text-gray-600">Confirming payment…</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
