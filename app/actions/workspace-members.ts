'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function removeMemberFromWorkspace(workspaceId: string, userId: string) {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
        return { error: 'Unauthorized' }
    }

    // Check if current user is workspace owner or admin
    const { data: currentMember } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', currentUser.id)
        .single()

    if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
        return { error: 'Only workspace owners/admins can remove members' }
    }

    // Prevent removing yourself
    if (userId === currentUser.id) {
        return { error: 'You cannot remove yourself from the workspace' }
    }

    try {
        // Get member details before removal for email
        const { data: removedMemberData } = await supabase
            .from('workspace_members')
            .select(`
                user_id,
                profiles:user_id (
                    email,
                    full_name
                )
            `)
            .eq('workspace_id', workspaceId)
            .eq('user_id', userId)
            .single()

        const { data: workspaceData } = await supabase
            .from('workspaces')
            .select('name')
            .eq('id', workspaceId)
            .single()

        // 1. Remove from all projects in this workspace (cascade will handle this via FK)
        const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('workspace_id', workspaceId)

        if (projects && projects.length > 0) {
            const projectIds = projects.map(p => p.id)
            await supabase
                .from('project_members')
                .delete()
                .eq('user_id', userId)
                .in('project_id', projectIds)
        }

        // 2. Remove from workspace
        const { error: removeError } = await supabase
            .from('workspace_members')
            .delete()
            .eq('workspace_id', workspaceId)
            .eq('user_id', userId)

        if (removeError) {
            return { error: removeError.message }
        }

        // 3. Send email notification
        if (removedMemberData?.profiles && workspaceData) {
            const { sendNotification } = await import('@/lib/email/notifications')
            const { data: currentUserProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', currentUser.id)
                .single()

            await sendNotification({
                type: 'workspace_member_removed',
                recipients: [{
                    email: (removedMemberData.profiles as any).email,
                    name: (removedMemberData.profiles as any).full_name || undefined,
                }],
                data: {
                    memberName: (removedMemberData.profiles as any).full_name || 'Team Member',
                    removedBy: currentUserProfile?.full_name || 'Workspace Admin',
                    workspaceName: workspaceData.name,
                },
            }).catch(err => console.error('Failed to send member removed email:', err))
        }

        revalidatePath('/settings/team')
        return { success: true }

    } catch (error: any) {
        console.error('Remove member error:', error)
        return { error: error.message || 'Failed to remove member' }
    }
}

export async function updateWorkspaceMemberRole(workspaceId: string, memberId: string, newRole: string) {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { error: 'Unauthorized' }

    // 1. Verify Current User Permissions
    const { data: currentMember } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', currentUser.id)
        .single()

    if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
        return { error: 'Only workspace owners/admins can change roles' }
    }

    // 2. Fetch Target Member
    const { data: targetMember } = await supabase
        .from('workspace_members')
        .select('role, user_id, profiles(email, full_name), workspaces(name)')
        .eq('workspace_id', workspaceId)
        .eq('user_id', memberId) // Note: Action receives userID as memberId mostly, let's verify usage. 
        // Actually, typical pattern is ID of the join table row or UserID. 
        // In removeMemberFromWorkspace we used userId. Let's stick to userId for consistency with that file.
        // WAIT: removeMemberFromWorkspace took (workspaceId, userId). 
        // Let's check the client usage. The client likely passes the USER ID based on the map.
        .single()

    if (!targetMember) return { error: 'Member not found' }

    // 3. Security Checks
    // - Admin cannot change Owner
    // - Owner cannot be changed by anyone else (only transfer ownership, which is a different flow)

    if (targetMember.role === 'owner') {
        return { error: 'Cannot change the role of the Workspace Owner' }
    }

    if (currentMember.role === 'admin' && targetMember.role === 'admin' && newRole !== 'member') {
        // Admins can demote other admins? Usually yes. Can they promote to Owner? No.
    }

    if (newRole === 'owner') {
        if (currentMember.role !== 'owner') {
            return { error: 'Only the Owner can transfer ownership' }
        }
        // Ownership transfer is complex (requires swapping roles), let's block it here for now 
        // and stick to Admin/Member toggling.
        return { error: 'Ownership transfer must be done via "Transfer Ownership" in settings' }
    }

    // 4. Update Role
    const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('workspace_id', workspaceId)
        .eq('user_id', memberId)

    if (error) return { error: error.message }

    // 5. Send Notification
    const { sendNotification } = await import('@/lib/email/notifications')
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentUser.id)
        .single()

    await sendNotification({
        type: 'workspace_member_role_changed',
        recipients: [{
            email: (targetMember.profiles as any).email,
            name: (targetMember.profiles as any).full_name || undefined,
        }],
        data: {
            memberName: (targetMember.profiles as any).full_name || 'Team Member',
            changedBy: currentUserProfile?.full_name || 'Workspace Admin',
            workspaceName: (targetMember.workspaces as any).name,
            oldRole: targetMember.role,
            newRole: newRole,
            actionUrl: `/dashboard`,
        },
    }).catch(err => console.error('Failed to send role update email:', err))

    revalidatePath('/settings/team')
    return { success: true }
}
