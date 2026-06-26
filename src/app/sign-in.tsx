import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { TextField } from '@/components/ui/text-field';
import { getApiErrorMessage } from '@/lib/api-error';
import { login, type LoginInput } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';

type IdentifierMethod = 'email' | 'phone';

export default function SignInScreen() {
  const router = useRouter();
  const startSession = useAuthStore((state) => state.startSession);

  const [method, setMethod] = useState<IdentifierMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const signIn = useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: async (session) => {
      await startSession(session);
      router.replace('/home');
    },
  });

  const handleSubmit = () => {
    signIn.mutate({ identifier: identifier.trim(), password });
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-night">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pb-8 pt-2">
            <Pressable onPress={() => router.back()} className="active:opacity-70">
              <Text className="text-base text-brand-blue-light">Back</Text>
            </Pressable>

            <View className="mt-6 gap-2">
              <Text className="text-3xl font-extrabold text-white">Welcome back</Text>
              <Text className="text-base text-brand-muted">
                Sign in with your email or phone number.
              </Text>
            </View>

            <View className="mt-8 gap-4">
              <SegmentedToggle
                options={[
                  { label: 'Email', value: 'email' },
                  { label: 'Phone', value: 'phone' },
                ]}
                value={method}
                onChange={(next) => {
                  setMethod(next);
                  setIdentifier('');
                }}
              />

              {method === 'email' ? (
                <TextField
                  label="Email"
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              ) : (
                <TextField
                  label="Phone number"
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="+1 555 234 5678"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              )}

              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
                autoCapitalize="none"
              />

              {signIn.isError ? (
                <Text className="text-sm text-red-400">{getApiErrorMessage(signIn.error)}</Text>
              ) : null}
            </View>

            <View className="mt-8">
              <Button label="Sign in" loading={signIn.isPending} onPress={handleSubmit} />
            </View>

            <Pressable
              onPress={() => router.replace('/sign-up')}
              className="mt-6 flex-row justify-center active:opacity-70"
            >
              <Text className="text-base text-brand-muted">New to Xcellar? </Text>
              <Text className="text-base font-semibold text-brand-blue-light">Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
