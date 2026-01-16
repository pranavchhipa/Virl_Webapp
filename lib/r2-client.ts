'use client';

/**
 * Client-side utility for uploading files to Cloudflare R2
 * Uses presigned URLs to upload directly from browser
 */

interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

interface UploadResult {
    key: string;
    success: boolean;
    error?: string;
}

/**
 * Upload a file to R2 via presigned URL
 */
export async function uploadFileToR2(
    file: File,
    projectId: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
    try {
        // Step 1: Get presigned upload URL from our API
        const sessionResponse = await fetch('/api/r2-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                contentType: file.type,
                projectId,
            }),
        });

        if (!sessionResponse.ok) {
            const error = await sessionResponse.json();
            throw new Error(error.error || 'Failed to get upload URL');
        }

        const { uploadUrl, key } = await sessionResponse.json();

        // Step 2: Upload file directly to R2 using presigned URL
        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    onProgress({
                        loaded: event.loaded,
                        total: event.total,
                        percentage: Math.round((event.loaded / event.total) * 100),
                    });
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed - This may be a CORS issue. Check R2 bucket CORS settings.'));
            });

            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
        });

        return { key, success: true };
    } catch (error: any) {
        console.error('R2 upload error:', error);
        return { key: '', success: false, error: error.message };
    }
}

/**
 * Get a signed download URL for an R2 asset
 */
export async function getR2DownloadUrl(assetId: string): Promise<string | null> {
    try {
        const response = await fetch(`/api/r2-download?assetId=${assetId}`);

        if (!response.ok) {
            throw new Error('Failed to get download URL');
        }

        const { url } = await response.json();
        return url;
    } catch (error) {
        console.error('Failed to get R2 download URL:', error);
        return null;
    }
}

/**
 * Get a signed download URL using the R2 key directly
 */
export async function getR2DownloadUrlByKey(key: string): Promise<string | null> {
    try {
        const response = await fetch(`/api/r2-download?key=${encodeURIComponent(key)}`);

        if (!response.ok) {
            throw new Error('Failed to get download URL');
        }

        const { url } = await response.json();
        return url;
    } catch (error) {
        console.error('Failed to get R2 download URL:', error);
        return null;
    }
}
