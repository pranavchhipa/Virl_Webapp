'use server';

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'virl-assets';

/**
 * Upload a file to Cloudflare R2
 * @param file - File buffer to upload
 * @param fileName - Original file name
 * @param contentType - MIME type of the file
 * @param folder - Optional folder path (e.g., 'projects/123')
 * @returns The R2 object key
 */
export async function uploadToR2(
    file: Buffer,
    fileName: string,
    contentType: string,
    folder?: string
): Promise<string> {
    // Generate unique key with timestamp to avoid collisions
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = folder
        ? `${folder}/${timestamp}-${sanitizedFileName}`
        : `assets/${timestamp}-${sanitizedFileName}`;

    await r2Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    }));

    return key;
}

/**
 * Get a signed URL for downloading a file from R2
 * @param key - The R2 object key
 * @param expiresIn - URL expiry time in seconds (default: 1 hour)
 * @returns Signed download URL
 */
export async function getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Get a signed URL for uploading directly from client
 * @param key - The R2 object key
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiry time in seconds (default: 15 mins)
 * @returns Signed upload URL
 */
export async function getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 900
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete a file from R2
 * @param key - The R2 object key
 */
export async function deleteFromR2(key: string): Promise<void> {
    await r2Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    }));
}

/**
 * Check if a file exists in R2
 * @param key - The R2 object key
 * @returns true if exists, false otherwise
 */
export async function existsInR2(key: string): Promise<boolean> {
    try {
        await r2Client.send(new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        }));
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate a presigned URL for client-side direct upload
 * Returns both the upload URL and the final key
 */
export async function createUploadSession(
    fileName: string,
    contentType: string,
    folder?: string
): Promise<{ uploadUrl: string; key: string }> {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = folder
        ? `${folder}/${timestamp}-${sanitizedFileName}`
        : `assets/${timestamp}-${sanitizedFileName}`;

    const uploadUrl = await getSignedUploadUrl(key, contentType);

    return { uploadUrl, key };
}
