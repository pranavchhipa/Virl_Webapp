import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BentoDashboard } from "@/components/dashboard/bento-dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { getUserProjects } from "@/app/actions/dashboard"
import { FeedbackWidget } from "@/components/feedback/feedback-widget"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const projects = await getUserProjects()

    // Fetch recent activity
    const { data: recentActivity } = await supabase
        .from('assets')
        .select('*, uploader:uploader_id(full_name), project:project_id(name)')
        .order('created_at', { ascending: false })
        .limit(10)

    // Get total storage used (sum of all asset file sizes from database)
    const { data: storageData } = await supabase
        .from('assets')
        .select('file_size')

    // Calculate total storage from file_size column
    const totalStorageBytes = storageData?.reduce((acc, asset) => acc + (asset.file_size || 0), 0) || 0

    // Get unique team members across all user's projects
    const { data: teamMembers } = await supabase
        .from('project_members')
        .select('user_id, profiles(full_name, avatar_url)')
        .in('project_id', projects.map(p => p.id))

    const uniqueMembers = teamMembers
        ? Array.from(new Map(teamMembers.map(m => [m.user_id, m.profiles])).values())
        : []

    // Get pending assets count
    const { count: pendingCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    const stats = {
        storageUsed: totalStorageBytes,
        storageTotal: 10 * 1024 * 1024 * 1024, // 10GB
        teamMemberCount: uniqueMembers.length,
        teamMembers: uniqueMembers.slice(0, 3), // First 3 for avatars
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
                        user={user}
                        projects={projects}
                        recentActivity={recentActivity || []}
                        stats={stats}
                    />
                </div>
            </div>
            <FeedbackWidget />
        </div>
    )
}

