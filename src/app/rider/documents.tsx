import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraIcon } from '@/components/icons';
import { RiderHeader } from '@/components/rider/rider-header';
import { Button } from '@/components/ui/button';
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
  const insets = useSafeAreaInsets();
  const profileQuery = useQuery({ queryKey: ['rider-profile'], queryFn: getMyRiderProfile });
  const urlByType = new Map(profileQuery.data?.documents.map((doc) => [doc.type, doc.url]) ?? []);
  const uploadedCount = profileQuery.data?.documents.length ?? 0;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <RiderHeader
        eyebrow="Almost there"
        title="Upload your documents"
        subtitle="Clear photos get you verified faster. You can submit and add the rest later."
        onBack={() => router.back()}
        step={4}
        totalSteps={4}
      />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <Text className="text-sm font-semibold text-gray-500">
          {uploadedCount} of {DOCUMENT_ORDER.length} uploaded
        </Text>
        {DOCUMENT_ORDER.map((type) => (
          <DocumentRow key={type} type={type} url={urlByType.get(type) ?? null} />
        ))}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 12 }} className="border-t border-gray-100 px-6 pt-3">
        <Button label="Submit for review" onPress={() => router.replace('/rider/pending')} />
      </View>
    </View>
  );
}

function DocumentRow({ type, url }: { type: RiderDocumentType; url: string | null }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploaded = Boolean(url);

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
      className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 active:opacity-80"
    >
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-brand-surface">
        {busy ? (
          <ActivityIndicator color={Brand.blue} />
        ) : uploaded ? (
          <Image source={{ uri: url as string }} className="h-14 w-14" resizeMode="cover" />
        ) : (
          <CameraIcon size={22} color={Brand.muted} />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-brand-navy">{DOCUMENT_LABELS[type]}</Text>
        <Text className="text-xs text-gray-500">
          {error ?? (uploaded ? 'Tap to replace' : 'Tap to take or pick a photo')}
        </Text>
      </View>
      <View className={`rounded-full px-3 py-1 ${uploaded ? 'bg-green-100' : 'bg-brand-surface'}`}>
        <Text className={`text-xs font-semibold ${uploaded ? 'text-green-700' : 'text-gray-500'}`}>
          {uploaded ? 'Done' : 'Required'}
        </Text>
      </View>
    </Pressable>
  );
}
