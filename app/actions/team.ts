'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'
import { MemberAddedEmail } from '@/lib/email/templates/member-added'
import { WorkspaceInviteEmail } from '@/lib/email/templates/workspace-invite'

export async function inviteUserAction({
    email,
    role,
    workspaceId,
    autoAssignProjectId,
    projectRole
}: {
    email: string
    role: string
    workspaceId: string
    autoAssignProjectId?: string
    projectRole?: string
}) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        if (!supabaseServiceKey) throw new Error("Missing Service Role Key")

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Check if user is already a member of THIS workspace
        // We need to resolve the user ID from email first to check membership
        const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('email', email).single()

        if (profile) {
            const { data: existingMember } = await supabase
                .from('workspace_members')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq('user_id', profile.id)
                .maybeSingle()

            if (existingMember) {
                return { success: false, error: "User is already a member of this workspace." }
            }
        }

        // 2. Create a pending invite record (For BOTH existing and new users)
        // This ensures they must ACCEPT the invite, preventing "instant add"
        const { error: inviteError } = await supabase
            .from('workspace_invites')
            .insert({
                workspace_id: workspaceId,
                email: email.toLowerCase(),
                role: role,
                project_id: autoAssignProjectId,
                project_role: projectRole
            })

        if (inviteError) {
            if (inviteError.code === '23505') {
                return { success: false, error: "Invite already sent to this email." }
            }
            throw inviteError
        }

        // 3. Send Invitation Email
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?email=${encodeURIComponent(email)}`

        await sendEmail({
            to: email,
            subject: "You've been invited to join the team!",
            react: WorkspaceInviteEmail({
                inviteeName: email.split('@')[0],
                inviterName: 'Virl Team', // We might want to pass the inviter's name
                workspaceName: 'Virl Workspace',
                role: role,
                inviteUrl: inviteUrl,
            })
        })

        revalidatePath('/settings/team')
        return { success: true, message: "Invite sent successfully." }
    } catch (error: any) {
        console.error("Invite Error:", error)
        return { success: false, error: error.message }
    }
}

export async function resendInviteAction(inviteId: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Fetch the invite details
        const { data: invite, error: fetchError } = await supabase
            .from('workspace_invites')
            .select('*')
            .eq('id', inviteId)
            .single()

        if (fetchError || !invite) {
            return { success: false, error: "Invite not found" }
        }

        // 2. Send the email again
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?email=${encodeURIComponent(invite.email)}`;
        await sendEmail({
            to: invite.email,
            subject: "Reminder: You've been invited to join Virl",
            react: WorkspaceInviteEmail({
                inviteeName: invite.email.split('@')[0],
                inviterName: 'Virl Team',
                workspaceName: 'Virl Workspace',
                role: invite.role,
                inviteUrl: inviteUrl,
            })
        })

        return { success: true, message: "Invite resent successfully" }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function cancelInviteAction(inviteId: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { error } = await supabase
            .from('workspace_invites')
            .delete()
            .eq('id', inviteId)

        if (error) throw error

        revalidatePath('/settings/team')
        return { success: true, message: "Invite cancelled" }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
