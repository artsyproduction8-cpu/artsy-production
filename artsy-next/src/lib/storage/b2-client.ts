import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const B2_KEY_ID = process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'artsy-production-raw-footage';
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com';
const B2_REGION = process.env.B2_REGION || 'us-west-004';

let s3ClientInstance: S3Client | null = null;

export function getB2Client(): S3Client | null {
  if (!B2_KEY_ID || !B2_APPLICATION_KEY) {
    return null;
  }
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      endpoint: B2_ENDPOINT,
      region: B2_REGION,
      credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APPLICATION_KEY,
      },
    });
  }
  return s3ClientInstance;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
  bucket: string;
  isMock?: boolean;
}

/**
 * Generate a presigned PUT URL for direct browser-to-B2 raw footage ingest
 * Default TTL: 15 minutes (900s)
 */
export async function generateUploadUrl(
  key: string,
  contentType: string = 'video/mp4',
  expiresIn: number = 900
): Promise<PresignedUrlResult> {
  const client = getB2Client();

  if (!client) {
    console.warn('[B2 Storage] B2 credentials not configured. Generating simulated local presigned URL.');
    const mockUploadUrl = `http://localhost:3000/api/storage/mock-upload?key=${encodeURIComponent(key)}`;
    return {
      uploadUrl: mockUploadUrl,
      key,
      expiresIn,
      bucket: B2_BUCKET_NAME,
      isMock: true,
    };
  }

  const command = new PutObjectCommand({
    Bucket: B2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    expiresIn,
    bucket: B2_BUCKET_NAME,
    isMock: false,
  };
}

/**
 * Generate a presigned GET URL for authenticated download/streaming
 */
export async function generateDownloadUrl(
  key: string,
  expiresIn: number = 900
): Promise<string> {
  const client = getB2Client();

  if (!client) {
    return `https://${B2_BUCKET_NAME}.b2.backblazeb2.com/${key}?mock_auth=1`;
  }

  const command = new GetObjectCommand({
    Bucket: B2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a single object from B2 storage
 */
export async function deleteObject(key: string): Promise<{ success: boolean; deletedKey: string; error?: string }> {
  const client = getB2Client();

  if (!client) {
    console.log(`[B2 Storage MOCK] Simulated deletion of S3 key: "${key}"`);
    return { success: true, deletedKey: key };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
    });
    await client.send(command);
    return { success: true, deletedKey: key };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[B2 Storage ERROR] Failed to delete key "${key}":`, errorMsg);
    return { success: false, deletedKey: key, error: errorMsg };
  }
}

/**
 * Batch delete all objects under a given directory prefix
 */
export async function deletePrefix(prefix: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const client = getB2Client();

  if (!client) {
    console.log(`[B2 Storage MOCK] Simulated prefix purge for: "${prefix}"`);
    return { success: true, deletedCount: 0 };
  }

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: B2_BUCKET_NAME,
      Prefix: prefix,
    });

    const listRes = await client.send(listCommand);
    const objects = listRes.Contents;

    if (!objects || objects.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: B2_BUCKET_NAME,
      Delete: {
        Objects: objects.map((obj) => ({ Key: obj.Key })),
        Quiet: true,
      },
    });

    await client.send(deleteCommand);
    return { success: true, deletedCount: objects.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[B2 Storage ERROR] Failed to purge prefix "${prefix}":`, errorMsg);
    return { success: false, deletedCount: 0, error: errorMsg };
  }
}
