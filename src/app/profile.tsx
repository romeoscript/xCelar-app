import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { updateProfile, type UpdateProfileInput } from '@/lib/profile-api';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');

  const mutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (updated) => {
      updateUser(updated);
      router.back();
    },
  });

  // Only send fields the user actually changed.
  const buildChanges = (): UpdateProfileInput => {
    const changes: UpdateProfileInput = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (trimmedName && trimmedName !== user?.fullName) {
      changes.fullName = trimmedName;
    }
    if (trimmedEmail && trimmedEmail !== (user?.email ?? '')) {
      changes.email = trimmedEmail;
    }
    if (phone && phone !== (user?.phoneNumber ?? '')) {
      changes.phoneNumber = phone;
    }
    return changes;
  };

  const handleSave = () => {
    const changes = buildChanges();
    if (Object.keys(changes).length === 0) {
      router.back();
      return;
    }
    mutation.mutate(changes);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="My profile" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <TextField
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            autoCapitalize="words"
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <PhoneInput label="Phone number" value={phone} onChange={setPhone} />

          {mutation.isError ? (
            <Text className="text-sm text-red-500">{getApiErrorMessage(mutation.error)}</Text>
          ) : null}

          <Button label="Save changes" loading={mutation.isPending} onPress={handleSave} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
