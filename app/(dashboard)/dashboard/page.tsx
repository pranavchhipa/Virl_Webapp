import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BentoDashboard } from "@/components/dashboard/bento-dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { getUserProjects } from "@/app/actions/dashboard"
import { getWorkspaceStorage, getUserStorage } from "@/app/actions/storage"
import { FeedbackWidget } from "@/components/feedback/feedback-widget"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { workspace } = await searchParams

    // STRICT WORKSPACE ENFORCEMENT
    // If no workspace ID in URL, find one and redirect immediately
    if (!workspace) {
        // 1. Try to find last created/accessed workspace where user is a member
        const { data: workspaces } = await supabase
            .from('workspace_members')
            .select('workspace_id, workspaces(name, created_at)')
            .eq('user_id', user.id)
            .limit(1)

        if (workspaces && workspaces.length > 0) {
            const defaultWorkspaceId = workspaces[0].workspace_id
            redirect(`/dashboard?workspace=${defaultWorkspaceId}`)
        }
        // If no workspaces at all, let it fall through (user might need to create one)
    }

    const projects = await getUserProjects(workspace)

    // Get filtered project IDs
    const projectIds = projects.map(p => p.id)

    // Fetch recent activity (Filtered by projects)
    const { data: recentActivity } = await supabase
        .from('assets')
        .select('*, uploader:uploader_id(full_name), project:project_id(name)')
        .in('project_id', projectIds) // Filter by workspace projects
        .order('created_at', { ascending: false })
        .limit(10)

    // Get Storage Stats (Dynamic based on Workspace or User Global)
    let storageStats;
    if (workspace) {
        storageStats = await getWorkspaceStorage(workspace)
    } else {
        storageStats = await getUserStorage(user.id)
    }

    // Get unique team members across all user's projects
    const { data: teamMembers } = await supabase
        .from('project_members')
        .select('user_id, profiles(full_name, avatar_url)')
        .in('project_id', projectIds)

    const uniqueMembers = teamMembers
        ? Array.from(new Map(teamMembers.map(m => [m.user_id, m.profiles])).values())
        : []

    // Get pending assets count
    const { count: pendingCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .in('project_id', projectIds) // Filter by workspace projects

    const stats = {
        storageUsed: storageStats.used,
        storageTotal: storageStats.limit,
        teamMemberCount: uniqueMembers.length,
        teamMembers: uniqueMembers.slice(0, 3),
        pendingAssets: pendingCount || 0
    }

    return (
        <div className="flex flex-col h-full">
            {/* Sticky Header with Notifications */}
            <DashboardHeader title="Dashboard" />

            {/* Dashboard Content */}
            <div className="flex-1 bg-[#f9f8fc]">
                <div className="px-6 py-6 max-w-7xl mx-auto w-full">
                    <BentoDashboard
                        key={workspace || 'all'}
                        projects={projects}
                        user={user}
                        recentActivity={recentActivity || []}
                        stats={stats}
                    />
                </div>
            </div>
            <FeedbackWidget />
        </div>
    )
}

