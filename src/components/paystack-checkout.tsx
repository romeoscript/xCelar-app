import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

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
 * Paystack redirects to the callback sentinel (on success or cancel), verifies
 * the transaction by its reference and reports the result — no external browser.
 */
export function PaystackCheckout({
  authorizationUrl,
  reference,
  onCancel,
  onResult,
}: PaystackCheckoutProps) {
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const visible = Boolean(authorizationUrl && reference);

  // Reset the loading spinner each time a new checkout opens.
  useEffect(() => {
    if (authorizationUrl) {
      setLoading(true);
    }
  }, [authorizationUrl]);

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

  const isCallback = (url: string) => url.startsWith(CALLBACK_URL);

  // Paystack redirects to the callback for both success and cancellation; catch
  // it in the request interceptor and again on navigation changes for safety.
  const onNavigationStateChange = (nav: WebViewNavigation) => {
    if (isCallback(nav.url)) {
      void completeWith();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-3">
          <Text className="text-lg font-bold text-brand-navy">Complete payment</Text>
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            className="rounded-full bg-gray-100 px-4 py-2 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-brand-navy">Cancel</Text>
          </Pressable>
        </View>

        {/* The overlay lives inside this container so it never covers Cancel. */}
        <View className="flex-1 overflow-hidden">
          {authorizationUrl ? (
            <WebView
              source={{ uri: authorizationUrl }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onShouldStartLoadWithRequest={(request) => {
                if (isCallback(request.url)) {
                  void completeWith();
                  return false;
                }
                return true;
              }}
              onNavigationStateChange={onNavigationStateChange}
            />
          ) : null}

          {loading || verifying ? (
            <View className="absolute inset-0 items-center justify-center bg-white/90">
              <ActivityIndicator color={Brand.blue} />
              <Text className="mt-2 text-base text-gray-600">
                {verifying ? 'Confirming payment…' : 'Loading…'}
              </Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
