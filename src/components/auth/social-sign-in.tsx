import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ReactElement } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { DeliveryLoader } from '@/components/ui/delivery-loader';
import { getErrorMessage } from '@/lib/api-error';
import type { AuthSession } from '@/lib/auth-api';
import { tapFeedback } from '@/lib/haptics';
import { isAppleSignInAvailable, signInWithApple, signInWithGoogle } from '@/lib/social-auth';

const BUTTON_HEIGHT = 48;
const BUTTON_RADIUS = 14;

type Provider = 'google' | 'apple';

/**
 * "Or continue with" Google and Apple. Apple shows only on iPhones that
 * support it. Cancelling is silent; failures (including Google not being
 * switched on yet) show a plain message under the buttons.
 */
export function SocialSignIn({ onSession }: { onSession: (session: AuthSession) => Promise<void> }) {
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const run = async (provider: Provider) => {
    setError(null);
    setPending(provider);
    try {
      const session = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      if (session) await onSession(session);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setPending(null);
    }
  };

  return (
    <View className="gap-3">
      <View className="my-1 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-gray-200" />
        <Text className="text-sm text-gray-400">or continue with</Text>
        <View className="h-px flex-1 bg-gray-200" />
      </View>

      <View className="flex-row gap-3">
        {/* Always shown; until the Google client IDs are set, tapping it explains that. */}
        <ProviderButton
          label="Google"
          accessibilityLabel="Continue with Google"
          mark={<GoogleMark />}
          disabled={pending !== null}
          onPress={() => void run('google')}
        />
        {appleAvailable ? (
          <ProviderButton
            label="Apple"
            accessibilityLabel="Continue with Apple"
            mark={<Ionicons name="logo-apple" size={20} color="#FFFFFF" />}
            dark
            disabled={pending !== null}
            onPress={() => void run('apple')}
          />
        ) : null}
      </View>

      {error ? <Text className="text-center text-sm text-red-500">{error}</Text> : null}
      <DeliveryLoader visible={pending !== null} label="Signing you in…" />
    </View>
  );
}

/**
 * One half of the provider row. Apple's dark style follows its sign-in
 * guidelines (white logo on black); Google's light style keeps the colour G.
 */
function ProviderButton({
  label,
  accessibilityLabel,
  mark,
  dark = false,
  disabled,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  mark: ReactElement;
  dark?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const press = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  return (
    <Animated.View style={[{ flex: 1 }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPressIn={() => {
          press.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          press.value = withSpring(1, { damping: 12, stiffness: 260 });
        }}
        onPress={() => {
          tapFeedback();
          onPress();
        }}
        className={`flex-row items-center justify-center gap-2 ${dark ? 'bg-black' : 'border border-gray-200 bg-white'}`}
        style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
      >
        {mark}
        <Text className={`text-base font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Google's multicolour "G", as their sign-in branding guidelines require. */
function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </Svg>
  );
}
