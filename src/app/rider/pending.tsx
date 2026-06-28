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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-night">
          <Text className="text-4xl">{rejected ? '⚠️' : '⏳'}</Text>
        </View>

        <View className="items-center gap-2">
          <View
            className={`rounded-full px-3 py-1 ${rejected ? 'bg-red-100' : 'bg-brand-gold-tint'}`}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-wider ${
                rejected ? 'text-red-700' : 'text-brand-navy'
              }`}
            >
              {rejected ? 'Action needed' : 'Under review'}
            </Text>
          </View>
          <Text className="text-center text-2xl font-extrabold text-brand-navy">
            {rejected ? 'Application not approved' : 'You’re on the list'}
          </Text>
          <Text className="text-center text-sm leading-5 text-gray-500">
            {rejected
              ? profile?.rejectionReason ?? 'Please update your documents and resubmit.'
              : 'We’re verifying your details. You’ll get an email the moment you’re cleared to ride.'}
          </Text>
        </View>
      </View>

      <View className="gap-3 px-6 pb-2">
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
    </SafeAreaView>
  );
}
