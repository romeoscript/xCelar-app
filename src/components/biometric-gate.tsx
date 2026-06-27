import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppState, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LockIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { authenticate } from '@/lib/biometrics';
import { usePreferencesStore } from '@/lib/preferences-store';

/**
 * Requires a biometric scan before showing its children whenever the user has
 * enabled biometric unlock. Re-locks when the app is sent to the background.
 */
export function BiometricGate({ children }: { children: ReactNode }) {
  const biometricEnabled = usePreferencesStore((state) => state.biometricEnabled);
  const locked = usePreferencesStore((state) => state.locked);
  const lock = usePreferencesStore((state) => state.lock);
  const unlock = usePreferencesStore((state) => state.unlock);

  const [prompting, setPrompting] = useState(false);

  // Lock again each time the app leaves the foreground, so a scan is needed on
  // return. We use 'background' (not 'inactive') so the system biometric prompt
  // — which briefly makes the app inactive — doesn't re-trigger a lock.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' && biometricEnabled) {
        lock();
      }
    });
    return () => subscription.remove();
  }, [biometricEnabled, lock]);

  const runPrompt = useCallback(async () => {
    setPrompting(true);
    try {
      if (await authenticate('Unlock Xcelar')) {
        unlock();
      }
    } finally {
      setPrompting(false);
    }
  }, [unlock]);

  // Auto-prompt as soon as the app becomes locked.
  useEffect(() => {
    if (biometricEnabled && locked) {
      void runPrompt();
    }
  }, [biometricEnabled, locked, runPrompt]);

  if (biometricEnabled && locked) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-blue-tint">
          <LockIcon size={28} color={Brand.blue} />
        </View>
        <Text className="mt-5 text-xl font-bold text-brand-navy">Xcelar is locked</Text>
        <Text className="mt-1 text-center text-base text-gray-500">
          Unlock with your biometrics to continue.
        </Text>
        <View className="mt-8 w-full">
          <Button label="Unlock" loading={prompting} onPress={() => void runPrompt()} />
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}
