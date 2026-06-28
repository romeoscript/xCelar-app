import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { getMyRiderProfile } from '@/lib/rider-api';

/** Routes the rider to the right place based on their application status. */
export default function RiderGate() {
  const profileQuery = useQuery({ queryKey: ['rider-profile'], queryFn: getMyRiderProfile });

  if (profileQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return <Redirect href="/rider/onboarding" />;
  }
  if (profile.status === 'APPROVED') {
    return <Redirect href="/rider/home" />;
  }
  return <Redirect href="/rider/pending" />;
}
