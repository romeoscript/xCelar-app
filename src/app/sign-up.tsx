import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckCircleIcon, ChevronLeftIcon, PackageIcon, TruckIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { TextField } from '@/components/ui/text-field';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { register, type RegisterInput } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';

const logo = require('@/assets/images/logo.png');

type IdentifierMethod = 'email' | 'phone';
type AccountType = 'customer' | 'rider';

export default function SignUpScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const startSession = useAuthStore((state) => state.startSession);

  const [fullName, setFullName] = useState('');
  const [method, setMethod] = useState<IdentifierMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(next === 'rider' ? 'rider' : 'customer');

  const signUp = useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: async (session) => {
      await startSession(session);
      const riderIntent = accountType === 'rider';
      // Email signups must verify with the code we just emailed them.
      if (session.user.email && !session.user.emailVerified) {
        router.replace(
          riderIntent ? { pathname: '/verify-email', params: { next: 'rider' } } : '/verify-email',
        );
        return;
      }
      router.replace(riderIntent ? '/rider' : '/home');
    },
  });

  const handleSubmit = () => {
    const base = { fullName: fullName.trim(), password };
    const input: RegisterInput =
      method === 'email' ? { ...base, email: email.trim() } : { ...base, phoneNumber: phone };
    signUp.mutate(input);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-2">
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-full bg-brand-surface active:opacity-70"
              >
                <ChevronLeftIcon size={22} color={Brand.navy} />
              </Pressable>
              <Image source={logo} style={{ width: 30, height: 30 }} resizeMode="contain" />
            </View>

            <View className="mt-7 gap-1.5">
              <Text className="text-[30px] font-extrabold leading-9 text-brand-navy">
                Create your account
              </Text>
              <Text className="text-base text-gray-500">It takes less than a minute.</Text>
            </View>

            <Text className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[1.5px] text-gray-400">
              I want to
            </Text>
            <View className="flex-row gap-3">
              <AccountTypeCard
                icon={PackageIcon}
                title="Send & order"
                subtitle="I'm a customer"
                active={accountType === 'customer'}
                onPress={() => setAccountType('customer')}
              />
              <AccountTypeCard
                icon={TruckIcon}
                title="Deliver & earn"
                subtitle="I'm a rider"
                active={accountType === 'rider'}
                onPress={() => setAccountType('rider')}
              />
            </View>

            <View className="mt-8 gap-5">
              <TextField
                label="Full name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ada Lovelace"
                autoCapitalize="words"
                autoComplete="name"
              />

              <View className="gap-2">
                <Text className="text-sm font-semibold text-brand-navy">Sign up with</Text>
                <SegmentedToggle
                  options={[
                    { label: 'Email', value: 'email' },
                    { label: 'Phone', value: 'phone' },
                  ]}
                  value={method}
                  onChange={setMethod}
                />
              </View>

              {method === 'email' ? (
                <TextField
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              ) : (
                <PhoneInput label="Phone number" value={phone} onChange={setPhone} />
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
                <Text className="text-sm text-red-500">{getApiErrorMessage(signUp.error)}</Text>
              ) : null}
            </View>

            <View className="mt-8">
              <Button
                label={accountType === 'rider' ? 'Continue as rider' : 'Create account'}
                loading={signUp.isPending}
                onPress={handleSubmit}
              />
            </View>

            <Pressable
              onPress={() => router.replace('/sign-in')}
              className="mt-6 flex-row justify-center active:opacity-70"
            >
              <Text className="text-base text-gray-500">Already have an account? </Text>
              <Text className="text-base font-semibold text-brand-blue">Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AccountTypeCard({
  icon: Icon,
  title,
  subtitle,
  active,
  onPress,
}: {
  icon: typeof PackageIcon;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-2xl border-2 p-4 active:opacity-80 ${
        active ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
      }`}
    >
      <View className="flex-row items-start justify-between">
        <View
          className={`h-11 w-11 items-center justify-center rounded-xl ${
            active ? 'bg-brand-blue' : 'bg-brand-surface'
          }`}
        >
          <Icon size={22} color={active ? '#ffffff' : Brand.navy} />
        </View>
        {active ? (
          <CheckCircleIcon size={22} color={Brand.blue} />
        ) : (
          <View className="h-5 w-5 rounded-full border-2 border-gray-300" />
        )}
      </View>
      <Text className="mt-3 text-base font-bold text-brand-navy">{title}</Text>
      <Text className="text-xs text-gray-500">{subtitle}</Text>
    </Pressable>
  );
}
