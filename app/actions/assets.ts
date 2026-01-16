'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyNewAsset } from '@/lib/notifications'
import { deleteFromR2 } from '@/lib/r2-storage'
import { checkStorageLimit } from './storage'

// Helper function (not exported to avoid server action issues)
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export async function createAssetRecord(
    projectId: string,
    fileName: string,
    filePath: string,
    fileType: string,
    fileSize: number = 0
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        // Check storage limit before proceeding
        if (fileSize > 0) {
            const storageCheck = await checkStorageLimit(projectId, fileSize)
            if (!storageCheck.allowed) {
                return {
                    error: storageCheck.message || 'Storage limit exceeded',
                    storageError: true,
                    currentUsed: formatBytes(storageCheck.currentUsed),
                    limit: formatBytes(storageCheck.limit)
                }
            }
        }

        // Database Insert with file_size
        const { data: asset, error: dbError } = await supabase
            .from('assets')
            .insert({
                project_id: projectId,
                uploader_id: user.id,
                file_name: fileName,
                file_path: filePath,
                file_type: fileType,
                file_size: fileSize,
                status: 'pending'
            })
            .select()
            .single()

        if (dbError) {
            console.error('DB Insert Error:', dbError)
            return { error: 'Failed to save asset record. However, file was uploaded.' }
        }

        // Send Notification (non-blocking)
        notifyNewAsset(projectId, user.id, fileName, asset.id)
            .catch(err => console.error('Email Sending Error:', err))

        revalidatePath(`/projects/${projectId}/assets`)
        return { success: true, asset }

    } catch (e) {
        console.error('Unexpected Asset Creation Error:', e)
        return { error: 'Internal Server Error' }
    }
}

export async function deleteAsset(assetId: string, projectId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    try {
        // 1. Get asset to find file_path
        const { data: asset, error: fetchError } = await supabase
            .from('assets')
            .select('file_path, project_id')
            .eq('id', assetId)
            .single()

        if (fetchError || !asset) {
            console.error('Asset fetch error:', fetchError)
            return { error: 'Asset not found' }
        }

        // 2. Delete from R2 storage
        try {
            await deleteFromR2(asset.file_path)
            console.log('Deleted from R2:', asset.file_path)
        } catch (r2Error) {
            console.error('R2 deletion error (continuing with DB delete):', r2Error)
            // Continue with DB deletion even if R2 fails
        }

        // 3. Delete from database
        const { error: deleteError } = await supabase
            .from('assets')
            .delete()
            .eq('id', assetId)

        if (deleteError) {
            console.error('DB delete error:', deleteError)
            return { error: 'Failed to delete asset from database' }
        }

        revalidatePath(`/projects/${projectId}/assets`)
        return { success: true }

    } catch (e) {
        console.error('Unexpected Asset Deletion Error:', e)
        return { error: 'Internal Server Error' }
    }
}

