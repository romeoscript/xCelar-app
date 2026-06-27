import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  CameraIcon,
  ChevronRightIcon,
  CloudUploadIcon,
  DocumentIcon,
  ImageIcon,
  type IconProps,
} from '@/components/icons';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FieldLabel } from '@/components/ui/field-label';
import { Brand } from '@/constants/theme';
import { formatFileSize } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { type LocalFile, type UploadTask, uploadFileWithProgress } from '@/lib/uploads';

export type InvoiceUploadProps = {
  label: string;
  required?: boolean;
  error?: string;
  /** The stored object key, or '' when none. */
  value: string;
  onChange: (key: string) => void;
};

type FileMeta = { name: string; size?: number };

/** Picks an invoice/proof from documents, gallery, or camera, uploads it to
 *  object storage with live progress, and reports the stored object key. */
export function InvoiceUpload({ label, required, error, value, onChange }: InvoiceUploadProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const taskRef = useRef<UploadTask | null>(null);
  const cancelledRef = useRef(false);

  const startUpload = async (file: LocalFile, meta: FileMeta) => {
    setUploadError(null);
    setFileMeta(meta);
    setProgress({ sent: 0, total: meta.size ?? 0 });
    setUploading(true);
    cancelledRef.current = false;
    try {
      const key = await uploadFileWithProgress(file, 'invoices', {
        onProgress: setProgress,
        onTask: (task) => {
          taskRef.current = task;
        },
      });
      if (!cancelledRef.current) {
        onChange(key);
      }
    } catch (failure) {
      if (!cancelledRef.current) {
        setFileMeta(null);
        setUploadError(failure instanceof Error ? failure.message : 'Upload failed.');
      }
    } finally {
      setUploading(false);
      taskRef.current = null;
    }
  };

  const fromDocuments = async () => {
    setSheetOpen(false);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) {
      return;
    }
    void startUpload(
      { uri: asset.uri, mimeType: asset.mimeType },
      { name: asset.name, size: asset.size ?? undefined },
    );
  };

  const fromGallery = async () => {
    setSheetOpen(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setUploadError('Allow photo access to choose an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) {
      return;
    }
    void startUpload(
      { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' },
      { name: asset.fileName ?? 'photo.jpg', size: asset.fileSize ?? undefined },
    );
  };

  const fromCamera = async () => {
    setSheetOpen(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setUploadError('Allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) {
      return;
    }
    void startUpload(
      { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' },
      { name: asset.fileName ?? 'photo.jpg', size: asset.fileSize ?? undefined },
    );
  };

  const cancelUpload = () => {
    cancelledRef.current = true;
    void taskRef.current?.cancelAsync();
    setUploading(false);
    setFileMeta(null);
  };

  const removeFile = () => {
    onChange('');
    setFileMeta(null);
  };

  const open = () => {
    tapFeedback();
    setSheetOpen(true);
  };

  const percent = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0;
  const hasFile = value.length > 0;

  return (
    <View className="gap-2">
      <FieldLabel label={label} required={required} />

      {uploading ? (
        <FileCard
          name={fileMeta?.name ?? 'Uploading…'}
          size={fileMeta?.size}
          percent={percent}
          onRemove={cancelUpload}
        />
      ) : hasFile ? (
        <FileCard name={fileMeta?.name ?? 'Proof document'} size={fileMeta?.size} onRemove={removeFile} />
      ) : (
        <Pressable
          onPress={open}
          className="items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8 active:opacity-70"
        >
          <CloudUploadIcon size={30} color={Brand.muted} />
          <Text className="text-base font-semibold text-brand-blue">Select proof document</Text>
          <Text className="text-xs text-gray-400">PDF or image</Text>
        </Pressable>
      )}

      {error || uploadError ? (
        <Text className="text-sm text-red-500">{uploadError ?? error}</Text>
      ) : null}

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-brand-navy">Select source</Text>
          <Pressable
            onPress={() => setSheetOpen(false)}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
          >
            <Text className="text-base text-gray-500">✕</Text>
          </Pressable>
        </View>
        <View className="mt-4">
          <SourceRow icon={DocumentIcon} label="Documents" onPress={fromDocuments} />
          <SourceRow icon={ImageIcon} label="Gallery" onPress={fromGallery} />
          <SourceRow icon={CameraIcon} label="Camera" onPress={fromCamera} />
        </View>
      </BottomSheet>
    </View>
  );
}

function FileCard({
  name,
  size,
  percent,
  onRemove,
}: {
  name: string;
  size?: number;
  percent?: number;
  onRemove: () => void;
}) {
  const uploading = percent !== undefined;
  return (
    <View className="gap-2 rounded-2xl border border-gray-200 bg-white p-4">
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 text-base font-semibold text-brand-blue" numberOfLines={1}>
          {name}
        </Text>
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className="h-7 w-7 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
        >
          <Text className="text-sm text-gray-500">✕</Text>
        </Pressable>
      </View>

      {uploading ? (
        <View className="h-1.5 overflow-hidden rounded-full bg-brand-surface">
          <View className="h-1.5 rounded-full bg-brand-blue" style={{ width: `${percent}%` }} />
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-500">
          {size != null ? formatFileSize(size) : uploading ? 'Uploading…' : 'Uploaded'}
        </Text>
        <Text className="text-xs font-medium text-gray-500">
          {uploading ? `${percent}%` : 'Done ✓'}
        </Text>
      </View>
    </View>
  );
}

function SourceRow({
  icon: Icon,
  label,
  onPress,
}: {
  icon: (props: IconProps) => React.JSX.Element;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className="flex-row items-center gap-3 border-b border-gray-100 py-4 active:opacity-70"
    >
      <Icon size={22} color={Brand.navy} />
      <Text className="flex-1 text-base font-medium text-gray-900">{label}</Text>
      <ChevronRightIcon size={20} color={Brand.muted} />
    </Pressable>
  );
}
