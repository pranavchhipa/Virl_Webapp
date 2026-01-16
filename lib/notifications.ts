import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import {
    getProjectAssignmentTemplate,
    getNewAssetTemplate,
    getMentionTemplate,
    getWorkspaceInviteTemplate
} from '@/lib/email-templates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Generic helper to get user email and preferences
async function getUserProfile(userId: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('email, full_name, notification_preferences').eq('id', userId).single()
    return data
}

export async function notifyWorkspaceInvite(email: string, role: string, workspaceId: string) {
    // This is usually direct because user might not exist.
    const url = `${APP_URL}/login?invite=${workspaceId}`
    await sendEmail({
        to: email,
        subject: "You've been invited to a workspace on Virl",
        html: getWorkspaceInviteTemplate(role, url)
    })
}

export async function notifyProjectAssignment(projectId: string, userId: string) {
    const supabase = await createClient()

    // Get Project & User Info
    const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
    if (!project) return

    const user = await getUserProfile(userId)
    if (!user || !user.email) return

    // Check preferences (Default true)
    const prefs = user.notification_preferences as any || {}
    if (prefs.project_assignment === false) return

    const { data: member } = await supabase.from('project_members').select('role').eq('project_id', projectId).eq('user_id', userId).single()
    const role = member?.role || 'member'

    const url = `${APP_URL}/projects/${projectId}`

    await sendEmail({
        to: user.email,
        subject: `Assigned to project: ${project.name}`,
        html: getProjectAssignmentTemplate(project.name, role, url)
    })
}

export async function notifyNewAsset(projectId: string, uploaderId: string, fileName: string, assetId: string) {
    const supabase = await createClient()

    const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
    if (!project) return

    const { data: uploader } = await supabase.from('profiles').select('full_name').eq('id', uploaderId).single()
    const uploaderName = uploader?.full_name || 'A team member'

    // Get all project members to notify
    // Filter out uploader
    const { data: members } = await supabase.from('project_members').select('user_id').eq('project_id', projectId)

    if (!members) return

    for (const member of members) {
        if (member.user_id === uploaderId) continue

        const user = await getUserProfile(member.user_id)
        if (!user || !user.email) continue

        // Check preferences
        const prefs = user.notification_preferences as any || {}
        if (prefs.new_assets === false) continue

        const url = `${APP_URL}/projects/${projectId}/assets/${assetId}`

        await sendEmail({
            to: user.email,
            subject: `New asset in ${project.name}`,
            html: getNewAssetTemplate(project.name, uploaderName, fileName, url)
        })
    }
}

export async function notifyMention(projectId: string, authorId: string, mentionedUserIds: string[], content: string, assetId?: string) {
    const supabase = await createClient()

    const { data: author } = await supabase.from('profiles').select('full_name').eq('id', authorId).single()
    const authorName = author?.full_name || 'Someone'

    for (const userId of mentionedUserIds) {
        const user = await getUserProfile(userId)
        if (!user || !user.email) continue

        // Check preferences
        const prefs = user.notification_preferences as any || {}
        if (prefs.mentions === false) continue

        const url = assetId
            ? `${APP_URL}/projects/${projectId}/assets/${assetId}`
            : `${APP_URL}/projects/${projectId}`

        await sendEmail({
            to: user.email,
            subject: `${authorName} mentioned you`,
            html: getMentionTemplate(content, authorName, url)
        })
    }
}
