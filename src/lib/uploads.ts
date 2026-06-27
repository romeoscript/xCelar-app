import * as FileSystem from 'expo-file-system/legacy';

import { api } from './api';

export type LocalFile = {
  uri: string;
  mimeType?: string;
};

export type UploadFolder = 'invoices' | 'avatars' | 'banners';

type PresignResponse = { uploadUrl: string; key: string };

/**
 * Upload a local file to object storage (MinIO/S3) via a presigned PUT and
 * return the stored object key. The bytes go straight to storage, not through
 * the API. Resolve a viewable URL later with `getFileUrl`.
 */
export async function uploadFile(file: LocalFile, folder: UploadFolder = 'invoices'): Promise<string> {
  const contentType = file.mimeType ?? 'application/octet-stream';
  const { data } = await api.post<PresignResponse>('/uploads/presign', { contentType, folder });

  const result = await FileSystem.uploadAsync(data.uploadUrl, file.uri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { 'Content-Type': contentType },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error('Upload failed. Please try again.');
  }
  return data.key;
}

/** Exchange a stored object key for a short-lived URL to view/download it. */
export async function getFileUrl(key: string): Promise<string> {
  const { data } = await api.get<{ url: string }>('/uploads/view', { params: { key } });
  return data.url;
}
