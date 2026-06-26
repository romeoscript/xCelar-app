import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatIcon, CheckCircleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';

const logo = require('@/assets/images/logo.png');
// Dotted world map — Wikimedia Commons, CC BY 3.0. See assets/ATTRIBUTIONS.md.
const worldMap = require('@/assets/images/world-map.png');

export default function WelcomeScreen() {
  const router = useRouter();

  // TODO: point these at the real auth screens once they exist.
  const handleGetStarted = () => router.push('/sign-up');
  const handleSignIn = () => router.push('/sign-in');

  return (
    <SafeAreaView className="flex-1 bg-brand-night" edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View className="relative flex-1 overflow-hidden">
        <Image
          source={worldMap}
          style={[StyleSheet.absoluteFill, { opacity: 0.85 }]}
          contentFit="cover"
        />

        <View className="absolute inset-0 items-center justify-center">
          <StatusPill />
        </View>
      </View>

      <View className="px-6 pb-2 pt-4">
        <Text className="text-[40px] font-extrabold leading-[44px] text-white">
          Send packages to anyone,{' '}
          <Text className="text-brand-blue-light">anywhere in the world</Text>
        </Text>
      </View>

      <View className="relative gap-3 px-6 pb-4 pt-6">
        <Button label="Get started" variant="primary" onPress={handleGetStarted} />
        <Button label="Sign in" variant="secondary" onPress={handleSignIn} />

        <ChatButton />
      </View>
    </SafeAreaView>
  );
}

function StatusPill() {
  return (
    <View className="flex-row items-center gap-2 rounded-2xl bg-white px-4 py-3">
      <Image source={logo} style={{ width: 22, height: 22 }} contentFit="contain" />
      <Text className="text-base font-semibold text-brand-navy">Package delivered!</Text>
      <CheckCircleIcon size={20} color={Brand.gold} />
    </View>
  );
}

function ChatButton() {
  // TODO: open the support chat once it exists.
  const handlePress = () => {};

  return (
    <Pressable
      onPress={handlePress}
      className="absolute right-7 top-[44px] h-14 w-14 items-center justify-center rounded-full bg-brand-blue active:opacity-90"
    >
      <ChatIcon size={26} color="#ffffff" dotColor={Brand.blue} />
    </Pressable>
  );
}
