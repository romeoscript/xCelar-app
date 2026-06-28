import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckCircleIcon, CloudUploadIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import {
  DOCUMENT_LABELS,
  getMyRiderProfile,
  uploadRiderDocument,
  type RiderDocumentType,
} from '@/lib/rider-api';
import { uploadFile } from '@/lib/uploads';

const DOCUMENT_ORDER: RiderDocumentType[] = [
  'DRIVER_PHOTO',
  'ID_FRONT',
  'ID_BACK',
  'VEHICLE_REGISTRATION',
  'INSURANCE',
  'ROAD_WORTHINESS',
];

export default function RiderDocumentsScreen() {
  const router = useRouter();
  const profileQuery = useQuery({ queryKey: ['rider-profile'], queryFn: getMyRiderProfile });
  const uploaded = new Set(profileQuery.data?.documents.map((doc) => doc.type) ?? []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Your documents" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text className="text-sm text-gray-500">
          Upload clear photos. Your account is reviewed once submitted — you’ll be notified when
          you’re approved.
        </Text>

        {DOCUMENT_ORDER.map((type) => (
          <DocumentRow key={type} type={type} done={uploaded.has(type)} />
        ))}

        <Button label="Submit for review" onPress={() => router.replace('/rider/pending')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentRow({ type, done }: { type: RiderDocumentType; done: boolean }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    if (busy) {
      return;
    }
    tapFeedback();
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo access to upload.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    setBusy(true);
    try {
      const fileKey = await uploadFile(
        { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' },
        'rider-docs',
      );
      await uploadRiderDocument({ type, fileKey });
      queryClient.invalidateQueries({ queryKey: ['rider-profile'] });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={pick}
      className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 active:opacity-80"
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-full ${
          done ? 'bg-brand-blue-tint' : 'bg-brand-surface'
        }`}
      >
        {busy ? (
          <ActivityIndicator color={Brand.blue} />
        ) : done ? (
          <CheckCircleIcon size={22} color={Brand.blue} />
        ) : (
          <CloudUploadIcon size={20} color={Brand.muted} />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-brand-navy">{DOCUMENT_LABELS[type]}</Text>
        <Text className="text-xs text-gray-500">
          {error ?? (done ? 'Uploaded — tap to replace' : 'Tap to upload a photo')}
        </Text>
      </View>
    </Pressable>
  );
}
