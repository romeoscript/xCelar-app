import { env } from './env';

export type LocalFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryUploadPreset);
}

/**
 * Upload a local file to Cloudinary via an unsigned preset and return its
 * hosted URL. Uses the `auto` resource type so images and PDFs both work.
 */
export async function uploadToCloudinary(file: LocalFile): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Uploads are not configured yet.');
  }

  const body = new FormData();
  // React Native's FormData accepts a file descriptor object here.
  body.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);
  body.append('upload_preset', env.cloudinaryUploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/auto/upload`,
    { method: 'POST', body },
  );
  const json = (await response.json()) as { secure_url?: string; error?: { message: string } };
  if (!response.ok || !json.secure_url) {
    throw new Error(json.error?.message ?? 'Upload failed. Please try again.');
  }
  return json.secure_url;
}
