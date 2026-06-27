import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { PhoneInput } from '@/components/ui/phone-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { GENDER_OPTIONS, NIGERIAN_STATES } from '@/constants/profile';
import { getApiErrorMessage } from '@/lib/api-error';
import { type Gender } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import { updateProfile, type UpdateProfileInput } from '@/lib/profile-api';
import { toast } from '@/lib/toast-store';

const STATE_OPTIONS = NIGERIAN_STATES.map((state) => ({ value: state, label: state }));

/** Parse a YYYY-MM-DD(...) string as a local date, avoiding timezone shifts. */
function parseDate(iso: string | null): Date | null {
  if (!iso) {
    return null;
  }
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(parseDate(user?.dateOfBirth ?? null));
  const [state, setState] = useState<string | null>(user?.state ?? null);

  const mutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (updated) => {
      updateUser(updated);
      toast('Profile updated');
      router.back();
    },
  });

  // Only send fields the user actually changed.
  const buildChanges = (): UpdateProfileInput => {
    const changes: UpdateProfileInput = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const isoDob = dateOfBirth ? toIsoDate(dateOfBirth) : null;

    if (trimmedName && trimmedName !== user?.fullName) {
      changes.fullName = trimmedName;
    }
    if (trimmedEmail && trimmedEmail !== (user?.email ?? '')) {
      changes.email = trimmedEmail;
    }
    if (phone && phone !== (user?.phoneNumber ?? '')) {
      changes.phoneNumber = phone;
    }
    if (gender && gender !== user?.gender) {
      changes.gender = gender;
    }
    if (state && state !== user?.state) {
      changes.state = state;
    }
    if (isoDob && isoDob !== (user?.dateOfBirth?.slice(0, 10) ?? null)) {
      changes.dateOfBirth = isoDob;
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
          <SelectField
            label="Gender"
            value={gender}
            options={GENDER_OPTIONS}
            onChange={setGender}
            placeholder="Select gender"
          />
          <DateField
            label="Date of birth"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            placeholder="Select date of birth"
            maximumDate={new Date()}
          />
          <SelectField
            label="State"
            value={state}
            options={STATE_OPTIONS}
            onChange={setState}
            placeholder="Select state"
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
