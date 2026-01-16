'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface DashboardProject {
    id: string
    name: string
    status: string
    description: string | null
    start_date: string | null
    due_date: string | null
    created_at: string
    workspace_id: string
    priority: string
    team?: any[] // We might fetch this later
}

export async function getUserProjects(): Promise<DashboardProject[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Get workspace roles to identify where user is Admin/Owner
    const { data: workspaceMemberships } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)

    const adminWorkspaceIds = (workspaceMemberships || [])
        .filter(m => m.role === 'owner' || m.role === 'admin')
        .map(m => m.workspace_id)

    // 2. Build the query
    let query = supabase
        .from('projects')
        .select(`
            *,
            project_members!inner(user_id)
        `)
        .order('created_at', { ascending: false })

    // If user has admin workspaces, we want projects from those workspaces OR projects where they are assigned.
    // However, OR conditions with relation filters in Supabase can be tricky.
    // Simplified approach:
    // If Admin in Workspace A: they should see ALL projects in A.
    // If Member in Workspace B: they should see ONLY assigned projects in B.

    // We can fetch in two parallel requests if needed, or construct a filter.
    // Actually, RLS is the best place for this. Assuming RLS isn't fully set up for "Admin sees all", 
    // we will fetch all projects the user is explicitly assigned to, AND all projects in admin workspaces.

    // Fetch 1: Assigned Projects
    const { data: assignedProjects } = await supabase
        .from('projects')
        .select('*, project_members!inner(user_id)')
        .eq('project_members.user_id', user.id)

    let allProjects = assignedProjects || [] as any[]

    // Fetch 2: Projects in Admin Workspaces (if any)
    if (adminWorkspaceIds.length > 0) {
        const { data: adminProjects } = await supabase
            .from('projects')
            .select('*, project_members(user_id)') // just to match shape, though not needed for auth
            .in('workspace_id', adminWorkspaceIds)

        if (adminProjects) {
            // Merge and deduplicate
            const existingIds = new Set(allProjects.map(p => p.id))
            const newProjects = adminProjects.filter(p => !existingIds.has(p.id))
            allProjects = [...allProjects, ...newProjects]
        }
    }

    // Re-sort because merging messed up order
    allProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return allProjects as DashboardProject[]
}
