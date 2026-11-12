import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { activateRider } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import { useGoBack } from '@/hooks/use-go-back';

const CODE_LENGTH = 8;
const MIN_PASSWORD_LENGTH = 8;

/**
 * A rider Xcelar has added sets their password with the one-time code staff
 * gave them. Also how a rider resets a forgotten password: staff issue a new code.
 */
export default function ActivateRiderScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const startSession = useAuthStore((state) => state.startSession);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const activate = useMutation({
    mutationFn: () => activateRider({ phoneNumber, code: code.trim(), password }),
    onSuccess: async (session) => {
      await startSession(session);
      router.replace('/rider/home');
    },
  });

  const mismatch = confirm.length > 0 && confirm !== password;
  const ready =
    phoneNumber.length > 0 &&
    code.trim().length === CODE_LENGTH &&
    password.length >= MIN_PASSWORD_LENGTH &&
    confirm === password;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 pt-2">
            <Pressable
              onPress={() => goBack()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="h-10 w-10 items-center justify-center rounded-full bg-brand-surface active:opacity-70"
            >
              <ChevronLeftIcon size={22} color={Brand.navy} />
            </Pressable>

            <View className="mt-7 gap-1.5">
              <Text className="text-[30px] font-extrabold leading-9 text-brand-navy">Activate your rider account</Text>
              <Text className="text-base text-gray-500">
                Use the phone number Xcelar registered for you and the {CODE_LENGTH}-character code you were given.
              </Text>
            </View>

            <View className="mt-8 gap-5">
              <PhoneInput label="Phone number" value={phoneNumber} onChange={setPhoneNumber} required />
              <TextField
                label="Activation code"
                value={code}
                onChangeText={(value) => setCode(value.toUpperCase())}
                placeholder="e.g. CZB7RWWL"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={CODE_LENGTH}
              />
              <TextField
                label="New password"
                value={password}
                onChangeText={setPassword}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextField
                label="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                error={mismatch ? 'Passwords don’t match' : undefined}
              />

              {activate.isError ? (
                <Text className="text-sm text-red-500">{getApiErrorMessage(activate.error)}</Text>
              ) : null}
            </View>

            <View className="mt-8">
              <Button
                label="Activate and sign in"
                loading={activate.isPending}
                disabled={!ready}
                onPress={() => activate.mutate()}
              />
            </View>
            <Text className="mt-4 text-center text-sm text-gray-500">
              Lost your code or forgot your password? Ask Xcelar for a new code.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
