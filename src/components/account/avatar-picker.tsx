import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';

import { PencilIcon } from '@/components/icons';
import { tapFeedback } from '@/lib/haptics';
import { uploadFile } from '@/lib/uploads';

export type AvatarPickerProps = {
  avatarUrl: string | null;
  initials: string;
  /** Called with the uploaded object key once a new photo is stored. */
  onChange: (key: string) => void | Promise<void>;
};

/** A round avatar that, when tapped, lets the user pick a photo, uploads it to
 *  object storage, and reports back the stored key. */
export function AvatarPicker({ avatarUrl, initials, onChange }: AvatarPickerProps) {
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
      setError('Allow photo access to change your picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setBusy(true);
    try {
      const key = await uploadFile({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' }, 'avatars');
      await onChange(key);
    } catch (uploadFailure) {
      setError(uploadFailure instanceof Error ? uploadFailure.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="items-center gap-2">
      <Pressable onPress={pick} className="active:opacity-80">
        <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-navy">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-24 w-24" resizeMode="cover" />
          ) : (
            <Text className="text-3xl font-bold text-white">{initials}</Text>
          )}
          {busy ? (
            <View className="absolute inset-0 items-center justify-center bg-black/40">
              <ActivityIndicator color="#ffffff" />
            </View>
          ) : null}
        </View>
        <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-blue">
          <PencilIcon size={14} color="#ffffff" />
        </View>
      </Pressable>
      <Text className="text-sm font-medium text-brand-blue">Change photo</Text>
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
