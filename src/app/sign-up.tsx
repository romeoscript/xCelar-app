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
import { register, type RegisterInput } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';

type IdentifierMethod = 'email' | 'phone';

export default function SignUpScreen() {
  const router = useRouter();
  const startSession = useAuthStore((state) => state.startSession);

  const [fullName, setFullName] = useState('');
  const [method, setMethod] = useState<IdentifierMethod>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const signUp = useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: async (session) => {
      await startSession(session);
      router.replace('/home');
    },
  });

  const handleSubmit = () => {
    const identifierField = method === 'email' ? { email: identifier } : { phoneNumber: identifier };
    signUp.mutate({ fullName: fullName.trim(), password, ...identifierField });
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
              <Text className="text-3xl font-extrabold text-white">Create your account</Text>
              <Text className="text-base text-brand-muted">
                Sign up with your email or phone number.
              </Text>
            </View>

            <View className="mt-8 gap-4">
              <TextField
                label="Full name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ada Lovelace"
                autoCapitalize="words"
                autoComplete="name"
              />

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
                placeholder="At least 8 characters"
                secureTextEntry
                autoCapitalize="none"
              />

              {signUp.isError ? (
                <Text className="text-sm text-red-400">{getApiErrorMessage(signUp.error)}</Text>
              ) : null}
            </View>

            <View className="mt-8">
              <Button label="Create account" loading={signUp.isPending} onPress={handleSubmit} />
            </View>

            <Pressable
              onPress={() => router.replace('/sign-in')}
              className="mt-6 flex-row justify-center active:opacity-70"
            >
              <Text className="text-base text-brand-muted">Already have an account? </Text>
              <Text className="text-base font-semibold text-brand-blue-light">Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
