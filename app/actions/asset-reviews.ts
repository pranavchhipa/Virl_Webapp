'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type Comment = {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: {
        full_name: string
        avatar_url: string | null
    } | null
}

export async function getAsset(assetId: string) {
    const supabase = await createClient()

    const { data: asset, error } = await supabase
        .from('assets')
        .select(`
            *,
            uploader:uploader_id (
                full_name,
                avatar_url
            )
        `)
        .eq('id', assetId)
        .single()

    if (error) {
        console.error('Error fetching asset:', error)
        return null
    }

    return asset
}

export async function getAssetComments(assetId: string) {
    const supabase = await createClient()

    console.log(`Fetching comments for asset: ${assetId}`)

    const { data: comments, error } = await supabase
        .from('asset_comments')
        .select(`
            *,
            profiles:user_id (
                full_name,
                avatar_url
            )
        `)
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching comments:', error)
        return []
    }

    console.log(`Fetched ${comments?.length} comments`)
    return comments as unknown as Comment[]
}

export async function addAssetComment(assetId: string, projectId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Insert Comment
    const { error } = await supabase
        .from('asset_comments')
        .insert({
            asset_id: assetId,
            user_id: user.id,
            content
        })

    if (error) {
        console.error('Comment Insert Error:', error)
        return { error: error.message || 'Failed to add comment' }
    }

    // 2. Fetch Project Owner to Notify (Optional / Best Effort)
    try {
        const { data: project } = await supabase
            .from('projects')
            .select(`
                name,
                workspaces (
                    owner_id,
                    profiles:owner_id (email)
                )
            `)
            .eq('id', projectId)
            .single()

        // @ts-ignore
        const ownerEmail = project?.workspaces?.profiles?.email
        const projectName = project?.name || 'Project'

        if (process.env.RESEND_API_KEY && ownerEmail) {
            await resend.emails.send({
                from: 'Virl Team <notifications@virl.in>',
                to: ownerEmail,
                subject: `New Comment on ${projectName}`,
                html: `
                    <p><strong>User</strong> commented on an asset:</p>
                    <blockquote style="border-left: 2px solid #ccc; padding-left: 10px; margin: 10px 0;">
                        ${content}
                    </blockquote>
                    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/assets/${assetId}">View Comment</a></p>
                `
            })
        }
    } catch (e) {
        console.error('Notification Error:', e)
    }

    revalidatePath(`/projects/${projectId}/assets/${assetId}`)
    return { success: true }
}

export async function updateAssetStatus(assetId: string, status: string, projectId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('assets')
        .update({ status })
        .eq('id', assetId)

    if (error) {
        console.error('Error updating status:', error)
        return { error: error.message }
    }

    revalidatePath(`/projects/${projectId}/assets/${assetId}`)
    return { success: true }
}
