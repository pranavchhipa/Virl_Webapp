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

        // 1. Check if user already exists in auth
        // Note: In a real app, you'd use supabase.auth.admin.inviteUserByEmail(email)
        // But that requires different setup. For now, we will:
        // A. Check if user is in profiles
        // B. If yes, add to workspace
        // C. If no, we can't easily create a ghost user without Auth Admin. 
        //    For this MVP, we'll assume we can only invite EXISTING users or we just send an email telling them to sign up.

        // Simpler MVP approach: Just add to workspace_members if profile exists. 
        // If profile doesn't exist, we can't add them to the table comfortably.
        // Let's check profile first.

        const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('email', email).single()

        if (!profile) {
            // User doesn't exist. 
            // 1. Create a pending invite record
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

            // 2. Send an email inviting them to signup.
            const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?email=${encodeURIComponent(email)}`;

            await sendEmail({
                to: email,
                subject: "You've been invited to join the team!",
                react: WorkspaceInviteEmail({
                    inviteeName: email.split('@')[0], // Fallback name
                    inviterName: 'Virl Team', // We might want to pass the inviter's name
                    workspaceName: 'Virl Workspace',
                    role: role,
                    inviteUrl: inviteUrl,
                })
            })

            revalidatePath('/settings/team')
            return { success: true, message: "User not found. Invite saved and email sent." }
        }

        // 2. Add to workspace_members
        const { error: insertError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: workspaceId,
                user_id: profile.id,
                role: role
            })

        if (insertError) {
            if (insertError.code === '23505') { // Unique violation
                // Check if we need to auto-assign project even if already in workspace
                if (autoAssignProjectId && projectRole) {
                    // Proceed to project assignment check
                } else {
                    return { success: false, error: "User is already in this workspace." }
                }
            } else {
                throw insertError
            }
        }

        // 3. Auto-assign to project if requested
        if (autoAssignProjectId && projectRole) {
            // Check if already in project
            const { data: existingProjectMember } = await supabase
                .from('project_members')
                .select('id')
                .eq('project_id', autoAssignProjectId)
                .eq('user_id', profile.id)
                .maybeSingle()

            if (!existingProjectMember) {
                // Get current user ID for 'assigned_by'
                // Since this uses service role, we don't have auth.uid(). 
                // However, we can probably leave 'assigned_by' null or fetch the inviting user if we passed it.
                // For now, let's leave assigned_by null or we could fetch the first admin. 
                // Ideally, we should pass the inviter's ID to this action, but for now let's just insert.

                await supabase
                    .from('project_members')
                    .insert({
                        project_id: autoAssignProjectId,
                        user_id: profile.id,
                        role: projectRole
                        // assigned_by: ??? 
                    })
            }
        }

        // 4. Send Notification Email
        // If auto-assigned to project, send project-specific email
        const isProjectInvite = !!autoAssignProjectId;
        await sendEmail({
            to: email,
            subject: isProjectInvite ? "You've been added to a project" : "You've been added to a workspace",
            react: MemberAddedEmail({
                memberName: profile.full_name || email.split('@')[0],
                addedBy: 'Admin', // Ideally pass this or fetch it
                entityName: isProjectInvite ? 'Project' : 'Virl Workspace', // Ideally fetch actual name
                role: isProjectInvite ? projectRole! : role,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
                isWorkspace: !isProjectInvite,
            })
        })

        revalidatePath('/settings/team')
        return { success: true, message: "User added successfully" }
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
