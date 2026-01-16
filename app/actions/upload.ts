'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyTeam } from './notifications'

export async function uploadAsset(formData: FormData) {
    const supabase = createClient()

    // 1. Auth Check
    const { data: { user } } = await (await supabase).auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string

    if (!file || !projectId) {
        return { error: 'Missing file or project ID' }
    }

    try {
        // 2. Upload to Storage
        const filePath = `${projectId}/${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await (await supabase)
            .storage
            .from('project-assets')
            .upload(filePath, file)

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError)
            return { error: 'Failed to upload file to storage.' }
        }

        // 3. Database Insert
        const { data: asset, error: dbError } = await (await supabase)
            .from('assets')
            .insert({
                project_id: projectId,
                uploader_id: user.id,
                file_name: file.name,
                file_path: filePath,
                file_type: file.type.split('/')[0], // 'video', 'image', etc.
                status: 'pending'
            })
            .select()
            .single()

        if (dbError) {
            console.error('DB Insert Error:', dbError)
            return { error: 'Failed to save asset record.' }
        }

        // 4. Send Notification via Notification Action
        try {
            await notifyTeam(projectId, file.name, user.user_metadata.full_name || 'Team Member')
        } catch (emailError) {
            console.error('Email Sending Error:', emailError)
            // Don't fail the whole action
        }

        revalidatePath(`/projects/${projectId}/assets`)
        return { success: true, asset }

    } catch (e) {
        console.error('Unexpected Upload Error:', e)
        return { error: 'Internal Server Error' }
    }
}
