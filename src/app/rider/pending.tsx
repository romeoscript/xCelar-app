import { useQuery } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { getMyRiderProfile } from '@/lib/rider-api';

export default function RiderPendingScreen() {
  const router = useRouter();
  const profileQuery = useQuery({ queryKey: ['rider-profile'], queryFn: getMyRiderProfile });

  if (profileQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }

  const profile = profileQuery.data;
  if (profile?.status === 'APPROVED') {
    return <Redirect href="/rider/home" />;
  }
  const rejected = profile?.status === 'REJECTED';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center gap-4 px-10">
        <Text className="text-5xl">{rejected ? '⚠️' : '⏳'}</Text>
        <Text className="text-center text-xl font-extrabold text-brand-navy">
          {rejected ? 'Application not approved' : 'Application under review'}
        </Text>
        <Text className="text-center text-sm text-gray-500">
          {rejected
            ? profile?.rejectionReason ?? 'Please update your documents and resubmit.'
            : 'We’re verifying your details. You’ll get an email the moment you’re approved.'}
        </Text>

        <View className="mt-2 w-full gap-3">
          {rejected ? (
            <Button label="Update & resubmit" onPress={() => router.replace('/rider/onboarding')} />
          ) : (
            <Button
              label="Check status"
              loading={profileQuery.isFetching}
              onPress={() => profileQuery.refetch()}
            />
          )}
          <Button label="Back to app" variant="secondary" onPress={() => router.replace('/(app)/home')} />
        </View>
      </View>
    </SafeAreaView>
  );
}
