import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { deleteAccount } from '@/lib/profile-api';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const endSession = useAuthStore((state) => state.endSession);

  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => deleteAccount(password),
    onSuccess: async () => {
      await endSession();
      router.replace('/');
    },
  });

  const confirmDelete = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => mutation.mutate() },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScreenHeader title="Delete account" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View className="gap-2 rounded-2xl bg-red-50 p-4">
            <Text className="text-base font-semibold text-red-600">This is permanent</Text>
            <Text className="text-sm leading-5 text-red-500">
              Deleting your account removes your profile, shipments, saved addresses, and wallet
              balance. You will not be able to recover them.
            </Text>
          </View>

          <TextField
            label="Confirm your password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
          />

          {mutation.isError ? (
            <Text className="text-sm text-red-500">{getApiErrorMessage(mutation.error)}</Text>
          ) : null}

          <Button
            label="Delete my account"
            className="bg-red-500"
            loading={mutation.isPending}
            disabled={password.length === 0}
            onPress={confirmDelete}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
