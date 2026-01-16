'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyProjectAssignment } from '@/lib/notifications'

// --- Permissions Helper ---
async function verifyProjectPermission(projectId: string, userId: string): Promise<boolean> {
    const supabase = await createClient()

    // 1. Check Workspace Owner/Admin Role
    const { data: project } = await supabase
        .from('projects')
        .select('workspace_id')
        .eq('id', projectId)
        .single()

    if (project) {
        const { data: workspaceMember } = await supabase
            .from('workspace_members')
            .select('role')
            .eq('workspace_id', project.workspace_id)
            .eq('user_id', userId)
            .single()

        if (workspaceMember?.role === 'owner' || workspaceMember?.role === 'admin') {
            return true
        }
    }

    // 2. Check Project Lead/Manager Role
    const { data: projectMember } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single()

    if (projectMember?.role === 'lead' || projectMember?.role === 'manager') {
        return true
    }

    return false
}

export async function getCurrentUserPermissions(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { canManage: false }

    const canManage = await verifyProjectPermission(projectId, user.id)
    return { canManage }
}

// --- Actions ---

export async function getProjectMembers(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_members')
        .select(`
            *,
            profiles (
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('project_id', projectId)
        .order('joined_at', { ascending: true })

    if (error) {
        console.error('Error fetching project members:', error)
        return []
    }

    return data || []
}

export async function addProjectMember({ projectId, userId, role }: {
    projectId: string
    userId: string
    role: 'manager' | 'editor' | 'contributor' | 'viewer'
}) {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { error: 'Unauthorized' }

    // Verify permission
    const canManage = await verifyProjectPermission(projectId, currentUser.id)
    if (!canManage) {
        return { error: 'You do not have permission to add members.' }
    }

    // Check if member is already in project
    const { data: existing } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single()

    if (existing) {
        return { error: 'User is already a member of this project' }
    }

    // Get project and workspace details for email
    const { data: projectData } = await supabase
        .from('projects')
        .select(`
            name,
            workspace_id,
            workspaces:workspace_id (
                name
            )
        `)
        .eq('id', projectId)
        .single()

    if (!projectData) {
        return { error: 'Project not found' }
    }

    // ✨ AUTO-ADD TO WORKSPACE if not already a member
    const { data: workspaceMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', projectData.workspace_id)
        .eq('user_id', userId)
        .single()

    if (!workspaceMember) {
        // User is NOT in workspace, add them automatically with 'member' role
        const { error: workspaceError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: projectData.workspace_id,
                user_id: userId,
                role: 'member' // Default role for auto-added users
            })

        if (workspaceError) {
            console.error('Error auto-adding to workspace:', workspaceError)
            return { error: 'Failed to add user to workspace' }
        }

        console.log(`✅ Auto-added user ${userId} to workspace ${projectData.workspace_id}`)
    }

    // Add member to project
    const { error } = await supabase
        .from('project_members')
        .insert({
            project_id: projectId,
            user_id: userId,
            role
        })

    if (error) {
        console.error('Error adding project member:', error)
        return { error: 'Failed to add member' }
    }

    // Send email notification
    if (projectData) {
        const { sendNotification, getUserEmailDetails } = await import('@/lib/email/notifications')
        const [newMemberDetails, currentUserProfile] = await Promise.all([
            getUserEmailDetails(userId),
            supabase.from('profiles').select('full_name').eq('id', currentUser.id).single()
        ])

        if (newMemberDetails) {
            await sendNotification({
                type: 'project_member_added',
                recipients: [newMemberDetails],
                data: {
                    memberName: newMemberDetails.name || 'Team Member',
                    addedBy: currentUserProfile.data?.full_name || 'Project Manager',
                    workspaceName: (projectData.workspaces as any)?.name || 'Workspace',
                    projectName: projectData.name,
                    role,
                    actionUrl: `/projects/${projectId}`,
                },
            }).catch(err => console.error('Failed to send member added email:', err))
        }
    }

    revalidatePath(`/projects/${projectId}/members`)
    revalidatePath('/settings/team') // ✨ Also refresh workspace team page
    return { success: true }
}

export async function getAvailableWorkspaceMembers(projectId: string) {
    const supabase = await createClient()

    // 1. Get workspace ID 
    const { data: project } = await supabase
        .from('projects')
        .select('workspace_id')
        .eq('id', projectId)
        .single()

    if (!project) return []

    // 2. Get workspace members
    const { data: workspaceMembers } = await supabase
        .from('workspace_members')
        .select(`
            user_id,
            profiles (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('workspace_id', project.workspace_id)

    if (!workspaceMembers) return []

    // 3. Get existing project members
    const { data: existingMembers } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)

    const existingUserIds = new Set(existingMembers?.map(m => m.user_id) || [])

    // 4. Filter
    return workspaceMembers
        .filter(m => !existingUserIds.has(m.user_id))
        .map(m => {
            // @ts-ignore
            const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
            return {
                id: profile?.id,
                full_name: profile?.full_name,
                email: profile?.email,
                avatar_url: profile?.avatar_url
            }
        })
}

export async function removeProjectMember(memberId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get member details before removal for email
    const { data: memberRecord } = await supabase
        .from('project_members')
        .select(`
            id,
            project_id,
            user_id,
            profiles:user_id (
                email,
                full_name
            ),
            projects:project_id (
                name,
                created_by,
                workspace_id,
                workspaces:workspace_id (
                    name
                )
            )
        `)
        .eq('id', memberId)
        .single()

    if (!memberRecord) return { error: 'Member not found' }

    const canManage = await verifyProjectPermission(memberRecord.project_id, user.id)
    if (!canManage) {
        return { error: 'You do not have permission to remove members.' }
    }

    // Security: Prevent removing Project Owner
    // @ts-ignore
    if (memberRecord.projects?.created_by === memberRecord.user_id) {
        return { error: 'Cannot remove the Project Owner' }
    }



    const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId)

    if (error) {
        console.error('Error removing project member:', error)
        return { error: 'Failed to remove member' }
    }

    // Send email notification
    if (memberRecord.profiles && memberRecord.projects) {
        const { sendNotification } = await import('@/lib/email/notifications')
        const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        await sendNotification({
            type: 'project_member_removed',
            recipients: [{
                email: (memberRecord.profiles as any).email,
                name: (memberRecord.profiles as any).full_name || undefined,
            }],
            data: {
                memberName: (memberRecord.profiles as any).full_name || 'Team Member',
                removedBy: currentUserProfile?.full_name || 'Project Manager',
                workspaceName: ((memberRecord.projects as any).workspaces as any)?.name || 'Workspace',
                projectName: (memberRecord.projects as any).name,
            },
        }).catch(err => console.error('Failed to send member removed email:', err))
    }

    revalidatePath(`/projects/${memberRecord.project_id}/members`)
    return { success: true }
}

export async function removeProjectMemberByUser(projectId: string, userId: string) {
    const supabase = await createClient()
    const { data: member } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single()

    if (!member) {
        return { error: 'Member not found in this project' }
    }

    return removeProjectMember(member.id)
}

export async function updateProjectMemberRole({
    memberId,
    role,
}: {
    memberId: string
    role: 'manager' | 'editor' | 'contributor' | 'viewer'
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get member details for email
    const { data: memberRecord } = await supabase
        .from('project_members')
        .select(`
            id,
            project_id,
            user_id,
            role,
            profiles:user_id (
                email,
                full_name
            ),
            projects:project_id (
                name,
                created_by,
                workspace_id,
                workspaces:workspace_id (
                    name
                )
            )
        `)
        .eq('id', memberId)
        .single()

    if (!memberRecord) return { error: 'Member not found' }

    const canManage = await verifyProjectPermission(memberRecord.project_id, user.id)
    if (!canManage) {
        return { error: 'You do not have permission to update roles.' }
    }

    // Security: Prevent demoting Project Owner
    // @ts-ignore
    if (memberRecord.projects?.created_by === memberRecord.user_id) {
        return { error: 'Cannot change the role of the Project Owner' }
    }



    const { error } = await supabase
        .from('project_members')
        .update({ role })
        .eq('id', memberId)

    if (error) {
        console.error('Error updating member role:', error)
        return { error: 'Failed to update role' }
    }

    // Send email notification
    if (memberRecord.profiles && memberRecord.projects) {
        const { sendNotification } = await import('@/lib/email/notifications')
        const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        await sendNotification({
            type: 'project_member_role_changed',
            recipients: [{
                email: (memberRecord.profiles as any).email,
                name: (memberRecord.profiles as any).full_name || undefined,
            }],
            data: {
                memberName: (memberRecord.profiles as any).full_name || 'Team Member',
                changedBy: currentUserProfile?.full_name || 'Project Manager',
                workspaceName: ((memberRecord.projects as any).workspaces as any)?.name || 'Workspace',
                projectName: (memberRecord.projects as any).name,
                oldRole: memberRecord.role,
                newRole: role,
                actionUrl: `/projects/${memberRecord.project_id}`,
            },
        }).catch(err => console.error('Failed to send role changed email:', err))
    }

    revalidatePath(`/projects/${memberRecord.project_id}/members`)
    return { success: true }
}

export async function getWorkspaceMembers(workspaceId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('workspace_members')
        .select(`*, profiles(*)`)
        .eq('workspace_id', workspaceId)

    if (error) return []
    return data
}
