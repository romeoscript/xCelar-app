import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { DocumentIcon } from '@/components/icons';
import { FieldLabel } from '@/components/ui/field-label';
import { Brand } from '@/constants/theme';
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';
import { tapFeedback } from '@/lib/haptics';

export type InvoiceUploadProps = {
  label: string;
  required?: boolean;
  error?: string;
  /** The uploaded document URL, or '' when none. */
  value: string;
  onChange: (url: string) => void;
};

/** Picks an invoice/proof document and uploads it to Cloudinary, surfacing the
 *  hosted URL to the form. Accepts images and PDFs. */
export function InvoiceUpload({ label, required, error, value, onChange }: InvoiceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pickAndUpload = async () => {
    if (uploading) {
      return;
    }
    if (!isCloudinaryConfigured()) {
      setUploadError('Uploads are not configured yet.');
      return;
    }
    tapFeedback();
    setUploadError(null);

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    setUploading(true);
    try {
      const url = await uploadToCloudinary({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      });
      onChange(url);
    } catch (uploadFailure) {
      setUploadError(uploadFailure instanceof Error ? uploadFailure.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const hasFile = value.length > 0;

  return (
    <View className="gap-2">
      <FieldLabel label={label} required={required} />
      <Pressable
        onPress={pickAndUpload}
        disabled={uploading}
        className={`items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 active:opacity-70 ${
          hasFile ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-300 bg-white'
        }`}
      >
        {uploading ? (
          <>
            <ActivityIndicator color={Brand.blue} />
            <Text className="text-sm text-gray-500">Uploading…</Text>
          </>
        ) : hasFile ? (
          <>
            <Text className="text-base font-semibold text-brand-blue">Document uploaded ✓</Text>
            <Text className="text-sm text-brand-blue">Tap to replace</Text>
          </>
        ) : (
          <>
            <DocumentIcon size={28} color={Brand.muted} />
            <Text className="text-base font-semibold text-brand-blue">Select proof document</Text>
            <Text className="text-xs text-gray-400">PDF or image</Text>
          </>
        )}
      </Pressable>
      {error || uploadError ? (
        <Text className="text-sm text-red-500">{uploadError ?? error}</Text>
      ) : null}
    </View>
  );
}
