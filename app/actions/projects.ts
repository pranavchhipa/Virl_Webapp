'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreateProjectState = {
    message: string
    error?: string
    projectId?: string
}

// Helper function to generate tags from project description using AI
async function generateTagsForProject(projectId: string, description: string, projectName: string) {
    if (!description || description.trim().length < 20) return

    try {
        // Call the AI tag generation endpoint
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL
            ? process.env.NEXT_PUBLIC_APP_URL
            : process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000'

        const response = await fetch(`${baseUrl}/api/generate-tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: description, projectName })
        })

        if (response.ok) {
            const { tags } = await response.json()
            if (tags && tags.length > 0) {
                const supabase = await createClient()
                await supabase
                    .from('projects')
                    .update({ tags })
                    .eq('id', projectId)
            }
        }
    } catch (error) {
        console.error('[generateTagsForProject] Error:', error)
        // Silent fail - tags are not critical
    }
}

// Update project description and auto-generate tags
export async function updateProjectDescription(projectId: string, description: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get project name for better tag generation
    const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single()

    // Update description
    const { error } = await supabase
        .from('projects')
        .update({ description })
        .eq('id', projectId)

    if (error) return { error: error.message }

    // Generate tags in background (non-blocking)
    generateTagsForProject(projectId, description, project?.name || 'Project')

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}
// ... types ...

// New Create Project Action for Dialog
export async function createProject(formData: FormData) {
    console.log("[createProject] Action started")
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.error("[createProject] No user found")
        return { error: "Unauthorized" }
    }
    console.log("[createProject] User found:", user.id)

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const startDate = formData.get("start_date") as string
    const dueDate = formData.get("due_date") as string
    const priority = formData.get("priority") as string || 'medium'

    if (!name) return { error: "Project name is required" }

    // 1. Get Workspace
    const { data: member } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).maybeSingle()
    let workspaceId = member?.workspace_id
    console.log("[createProject] Member workspace:", workspaceId)

    if (!workspaceId) {
        const { data: own } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).maybeSingle()
        workspaceId = own?.id
        console.log("[createProject] Owned workspace:", workspaceId)
    }

    if (!workspaceId) {
        console.error("[createProject] All workspace checks failed")
        return { error: "No workspace found" }
    }

    const { data, error } = await supabase
        .from('projects')
        .insert({
            name,
            description,
            workspace_id: workspaceId,
            start_date: startDate || null,
            due_date: dueDate || null,
            status: 'active',
            priority: priority, // Expects migration to have run
            created_by: user.id // Track who created the project
        })
        .select()
        .single()

    if (error) {
        console.error("[createProject] Insert Error:", error)
        return { error: error.message }
    }
    console.log("[createProject] Project created:", data.id)

    // Assign Creator as Manager
    await supabase.from('project_members').insert({ project_id: data.id, user_id: user.id, role: 'manager' })

    // Send email notification to all workspace members
    try {
        const { sendNotification, getUsersEmailDetails } = await import('@/lib/email/notifications')

        // Get all workspace members
        const { data: workspaceMembers } = await supabase
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .neq('user_id', user.id) // Exclude creator

        if (workspaceMembers && workspaceMembers.length > 0) {
            const memberIds = workspaceMembers.map(m => m.user_id)
            const recipients = await getUsersEmailDetails(memberIds)

            const { data: creatorProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()

            if (recipients.length > 0) {
                await sendNotification({
                    type: 'project_created',
                    recipients,
                    data: {
                        memberName: '', // Will be personalized per recipient
                        projectName: data.name,
                        createdBy: creatorProfile?.full_name || 'A team member',
                        projectId: data.id,
                    },
                }).catch(err => console.error('Failed to send project created emails:', err))
            }
        }
    } catch (emailError) {
        console.error('[createProject] Email notification error:', emailError)
        // Don't fail the project creation if email fails
    }

    // Generate tags from description if provided (non-blocking)
    if (description && description.trim().length >= 20) {
        generateTagsForProject(data.id, description, name)
    }

    revalidatePath('/projects')
    return { id: data.id }
}

export async function updateProjectStatus(projectId: string, status: string) {
    const supabase = await createClient()

    // Get current user for debugging
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[updateProjectStatus] User:', user?.id, 'Project:', projectId, 'Status:', status)

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // First check if user has permission (is manager or creator)
    const { data: project } = await supabase
        .from('projects')
        .select('id, created_by')
        .eq('id', projectId)
        .single()

    const { data: membership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

    console.log('[updateProjectStatus] Project created_by:', project?.created_by, 'User role:', membership?.role)

    // Perform the update
    const { data, error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId)
        .select()

    if (error) {
        console.error('[updateProjectStatus] Error:', error)
        return { error: error.message }
    }

    // RLS might block without throwing an error - check if rows affected
    if (!data || data.length === 0) {
        console.error('[updateProjectStatus] No rows updated - RLS blocked')
        return { error: 'Permission denied - you are not authorized to update this project' }
    }

    console.log('[updateProjectStatus] Success, rows affected:', data?.length)
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function createProjectFromIdea(idea: {
    title?: string
    description?: string
    script_outline?: string[]
    assigneeId?: string
}): Promise<CreateProjectState> {
    const supabase = createClient()

    try {
        const { data: { user }, error: userError } = await (await supabase).auth.getUser()
        if (userError || !user) {
            return { message: 'Unauthorized', error: 'User not logged in' }
        }

        // 1. Get the user's workspace
        const { data: workspaceMember } = await (await supabase)
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id)
            .single()

        let workspaceId = workspaceMember?.workspace_id

        if (!workspaceId) {
            // Fallback: Check if they own any workspace
            const { data: ownWorkspace } = await (await supabase)
                .from('workspaces')
                .select('id')
                .eq('owner_id', user.id)
                .single()

            if (!ownWorkspace) {
                console.error("Values: Member", workspaceMember, "Owned", ownWorkspace)
                return { message: 'No Workspace Found', error: 'You do not belong to any workspace. Please create or join one first.' }
            }
            workspaceId = ownWorkspace.id
        }

        // 2. Format description
        const description = idea.script_outline
            ? idea.script_outline.join('\n')
            : idea.description || ''

        console.log(`[CreateProject] Attempting insert into workspace: ${workspaceId} for user: ${user.id}`)

        // 3. Create Project
        const { data: project, error: insertError } = await (await supabase)
            .from('projects')
            .insert({
                workspace_id: workspaceId,
                name: idea.title || 'New Viral Project',
                description: description,
                status: 'active', // Default in schema
            })
            .select()
            .single()

        if (insertError) {
            console.error('[CreateProject] Insert Error Details:', JSON.stringify(insertError, null, 2))
            return { message: 'Failed to create project', error: `DB Error: ${insertError.message} (${insertError.code})` }
        }

        // 4. Update status to 'Scripting' (as requested)
        const { error: updateError } = await (await supabase)
            .from('projects')
            .update({ status: 'Scripting' })
            .eq('id', project.id)

        if (updateError) {
            console.warn('Could not set status to Scripting', updateError)
        }

        // 4b. Assign Creator as Project Manager (Critical for RBAC)
        const { error: memberError } = await (await supabase)
            .from('project_members')
            .insert({
                project_id: project.id,
                user_id: user.id,
                role: 'manager'
            })

        if (memberError) {
            console.error('Failed to assign creator to project', memberError)
            return { message: 'Project created but access lost. Contact admin.', error: memberError.message }
        }

        // 5. Handle Assignment (Create a Task if assignee provided)
        if (idea.assigneeId) {
            // Resolve 'me' to user.id
            const assigneeUuid = idea.assigneeId === 'me' ? user.id : idea.assigneeId

            // Only attempt if it looks like a UUID or is 'me'.
            if (assigneeUuid === user.id || assigneeUuid.length > 30) {
                const { error: taskError } = await (await supabase)
                    .from('tasks')
                    .insert({
                        project_id: project.id,
                        title: 'Scripting & Strategy',
                        description: 'Execute viral strategy: ' + (idea.title || 'Untitled'),
                        status: 'scripting',
                        assigned_to: assigneeUuid
                    })
                if (taskError) console.error('Failed to assign task', taskError)
            }
        }

        revalidatePath('/projects')
        return { message: 'Project created successfully', projectId: project.id }

    } catch (e) {
        console.error('Server Action Error', e)
        return { message: 'Internal Server Error', error: String(e) }
    }
}

export async function archiveProject(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get project details and members for email
    const { data: projectData } = await supabase
        .from('projects')
        .select('name, workspace_id')
        .eq('id', projectId)
        .single()

    if (!projectData) return { error: 'Project not found' }

    // Update status to archived
    const { error } = await supabase
        .from('projects')
        .update({ status: 'archived' })
        .eq('id', projectId)

    if (error) {
        console.error('Error archiving project:', error)
        return { error: 'Failed to archive project' }
    }

    // Send email notification to all project members
    try {
        const { sendNotification, getUsersEmailDetails } = await import('@/lib/email/notifications')

        const { data: projectMembers } = await supabase
            .from('project_members')
            .select('user_id')
            .eq('project_id', projectId)
            .neq('user_id', user.id) // Exclude the person who archived it

        if (projectMembers && projectMembers.length > 0) {
            const memberIds = projectMembers.map(m => m.user_id)
            const recipients = await getUsersEmailDetails(memberIds)

            const { data: archiverProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()

            if (recipients.length > 0) {
                await sendNotification({
                    type: 'project_archived',
                    recipients,
                    data: {
                        memberName: '', // Personalized per recipient
                        projectName: projectData.name,
                        archivedBy: archiverProfile?.full_name || 'A team member',
                        projectId,
                    },
                }).catch(err => console.error('Failed to send archive emails:', err))
            }
        }
    } catch (emailError) {
        console.error('Archive email notification error:', emailError)
    }

    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/dashboard')
    return { success: true }
}

export async function restoreProject(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from('projects')
        .update({ status: 'active' })
        .eq('id', projectId)

    if (error) return { error: error.message }
    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get project details and members for email BEFORE deletion
    const { data: projectData } = await supabase
        .from('projects')
        .select('name, workspace_id')
        .eq('id', projectId)
        .single()

    if (!projectData) return { error: 'Project not found' }

    // Get all members before deletion
    const { data: projectMembers } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .neq('user_id', user.id) // Exclude the deleter

    // Delete project (cascade will handle members, tasks, etc.)
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

    if (error) {
        console.error('Error deleting project:', error)
        return { error: 'Failed to delete project' }
    }

    // Send email notification to all former project members
    try {
        const { sendNotification, getUsersEmailDetails } = await import('@/lib/email/notifications')

        if (projectMembers && projectMembers.length > 0) {
            const memberIds = projectMembers.map(m => m.user_id)
            const recipients = await getUsersEmailDetails(memberIds)

            const { data: deleterProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()

            if (recipients.length > 0) {
                await sendNotification({
                    type: 'project_deleted',
                    recipients,
                    data: {
                        memberName: '', // Personalized per recipient
                        projectName: projectData.name,
                        deletedBy: deleterProfile?.full_name || 'A team member',
                    },
                }).catch(err => console.error('Failed to send deletion emails:', err))
            }
        }
    } catch (emailError) {
        console.error('Delete email notification error:', emailError)
    }

    revalidatePath('/projects')
    return { success: true }
}

// Tag Management Actions
export async function addProjectTag(projectId: string, tag: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const cleanTag = tag.trim().toLowerCase()
    if (!cleanTag) return { error: 'Tag cannot be empty' }

    // Get current tags
    const { data: project } = await supabase
        .from('projects')
        .select('tags')
        .eq('id', projectId)
        .single()

    if (!project) return { error: 'Project not found' }

    const currentTags = project.tags || []

    // Avoid duplicates
    if (currentTags.includes(cleanTag)) {
        return { error: 'Tag already exists' }
    }

    const { error } = await supabase
        .from('projects')
        .update({ tags: [...currentTags, cleanTag] })
        .eq('id', projectId)

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}`)
    return { success: true, tags: [...currentTags, cleanTag] }
}

export async function removeProjectTag(projectId: string, tag: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get current tags
    const { data: project } = await supabase
        .from('projects')
        .select('tags')
        .eq('id', projectId)
        .single()

    if (!project) return { error: 'Project not found' }

    const newTags = (project.tags || []).filter((t: string) => t !== tag)

    const { error } = await supabase
        .from('projects')
        .update({ tags: newTags })
        .eq('id', projectId)

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}`)
    return { success: true, tags: newTags }
}
